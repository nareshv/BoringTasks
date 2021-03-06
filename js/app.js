(function() {
    'use strict';

    // Settings for the editor
    var editor;
    var editor_opts = {
        container: "epiceditor",
        button: {
            fullscreen: false
        },
        theme: {
            base: '/themes/base/epiceditor.css',
            preview: '/themes/preview/preview-dark.css',
            editor: '/themes/editor/epic-dark.css'
        }
    };
    var appconfig = {
        classes : {
            after: {
                v2 : "pure-u-9-24",
                v3 : "pure-u-9-24"
            },
            before: {
                v2 : "pure-u-18-24",
                v3 : "pure-u-6-24 hidden"
            }
        },
        ui : {
            showdate : false,
            showrevision : true
        },
        runtime : {
            curMonth : moment(new Date()).format('MM-YYYY')
        }
    };

    var ENTER_KEY = 13;
    var newTodoDom = document.getElementById('new-todo');
    var syncDom = document.getElementById('sync-wrapper');

    // EDITING STARTS HERE (you dont need to edit anything above this line)
    var db = new PouchDB('todos');
    var remoteCouch = "http://127.0.0.1:5984/todos";

    db.info(function(err, info) {
        db.changes({
            since : 'now',
            live: true,
            include_docs : false
        }).on('change', function() {
            showTodos();
        });
    });

    // We have to create a new todo document and enter it in the database
    function addTodo(text) {
        var todo = {
            _id: new Date().toISOString(),
            title: text,
            endDate: new Date(),
            notes: "",
            completed: false
        };
        db.put(todo).then(function (result) {
            console.log('Added new todo');
        }).catch(function(err) {
            console.log('Failed to create new todo.');
        });
    }

    // Show the current list of todos by reading them from the database
    function showTodos() {
        // FIXME: Get the active month from the Menu UI
        //var now  = moment(new Date()).format('MM-YYYY');
        var now = appconfig.runtime.curMonth;
        db.query(function(doc, emit) {
          if (moment(doc.endDate).format('MM-YYYY') === now) {
            emit(doc);
          }
        },
        {include_docs : true, descending : true },
        function(err, results) { if (!err) redrawTodosUI(results.rows); });
    }

    function checkboxChanged(todo, event) {
        todo.completed = event.target.checked;
        db.get(todo._id).then(function(todo) {
            db.put(todo).then(function(result) {
                console.log('Successfully updated checkbox status.');
            }).catch(function(err){
                console.log('Failed to update the checkbox status.');
            })
        });
    }

    // User pressed the delete button for a todo, delete it
    function deleteButtonPressed(todo) {
        db.get(todo._id).then(function(doc) {
            return db.remove(doc);
        }).then(function(result) {
            console.log('successfully removed the todo.');
        }).catch(function(err) {
            console.log('Failed to remove the todo')
        })
    }

    // User pressed the change date button for a todo, delete it
    // FIXME: show the popup for date selector and update accordingly
    function endDateButtonPressed(todo, newEndDate) {
        /*
        todo.endDate = newEndDate;
        db.put(todo);
        */
        console.log("FIXME: has to save the new todo by updating the date");
    }

    // The input box when editing a todo has blurred, we should save
    // the new title or delete the todo if the title is empty
    function todoBlurred(todo, event) {
        var trimmedText = event.target.value.trim();
        if (!trimmedText) {
            db.remove(todo);
        } else {
            todo.title = trimmedText;
            db.put(todo);
        }
    }

    // Initialise a sync with the remote server
    function sync() {
        syncDom.setAttribute('data-sync-state', 'syncing');
        var opts = {continuous: true, complete: syncError};
        db.replicate.to(remoteCouch, opts);
        db.replicate.from(remoteCouch, opts);
    }

    // EDITING STARTS HERE (you dont need to edit anything below this line)

    // There was some form or error syncing
    function syncError() {
        syncDom.setAttribute('data-sync-state', 'error');
    }

    // User has double clicked a todo, display an input so they can edit the title
    function todoDblClicked(todo) {
        var div = document.getElementById('li_' + todo._id);
        var inputEditTodo = document.getElementById('input_' + todo._id);
        div.className = 'editing';
        inputEditTodo.focus();
    }

    // User has clicked on the todo, display the notes that can be edited
    function todoClicked(todo) {
        // change the classes for the elements
        var v2 = document.getElementById("v2");
        v2.className = appconfig.classes.after.v2;
        var v3 = document.getElementById("v3");
        v3.className = appconfig.classes.after.v3;

        // Initialize the editor
        if (!editor) {
            editor = new EpicEditor(editor_opts).load();
        }

        // actual task of putting the elements into context
        var title = document.getElementById("editortitle");
        title.innerHTML = getDisplayTitle(todo);
        console.log("Fetching data from : %s", todo._id);
        editor.importFile(todo._id, todo.notes);
        var saveButton = document.getElementById("editorsave");
        if (saveButton) {
            $(saveButton).data('uuid', todo._id);
        }
        var doneButton = document.getElementById("editordone");
        if (doneButton) {
            $(doneButton).data('uuid', todo._id);
        }
    }

    function closeEditor() {
        // hide the editor by changing the classes for the elements
        var v2 = document.getElementById("v2");
        v2.className = appconfig.classes.before.v2;
        var v3 = document.getElementById("v3");
        v3.className = appconfig.classes.before.v3;
    }

    // User has clicked on the save button
    function saveButtonClicked(event) {
        var id = $(event.target).data('uuid');
        console.log('Fetching save button : %s', id);
        db.get(id).then(function(doc){
            doc.notes = editor.exportFile();
            db.put(doc).catch(function(err){
                console.log('Failed to update on clicking save button');

            });
        }).catch(function(err){
            console.log('Failed to get on clicking save button clicked.')
        })
    }
    function doneButtonClicked(event) {
        var id = $(event.target).data('uuid');
        db.get(id).then(function(doc){
            doc.notes = editor.exportFile();
            db.put(doc).then(function() {
                closeEditor();
            }).catch(function(err) {
                console.log('Failed to save the doc on done');
            })
        }).catch(function(err){
            console.log('Failed to get on clicking save button clicked.')
        })
    }

    // If they press enter while editing an entry, blur it to trigger save
    // (or delete)
    function todoKeyPressed(todo, event) {
        if (event.keyCode === ENTER_KEY) {
            var inputEditTodo = document.getElementById('input_' + todo._id);
            inputEditTodo.blur();
        }
    }

    function getDisplayTitle(todo) {
        var title = [];
        if (appconfig.ui.showdate) {
            title.push('[' + moment(todo.endDate).format('MM-DD-YYYY') + ']')
        }
        if (appconfig.ui.showrevision) {
            title.push('rev' + todo._rev.split('-')[0] + ', ')
        }
        title.push(todo.title);
        return title.join(' ');
    }

    // Given an object representing a todo, this will create a list item
    // to display it.
    function createTodoListItem(todo) {
        var checkbox = document.createElement('input');
        checkbox.className = 'toggle';
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', checkboxChanged.bind(this, todo));

        var label = document.createElement('label');
        var date  = document.createElement("span");
        date.className = "label-date";
        date.appendChild(document.createTextNode(moment(todo.endDate).format('DD/MMM dddd')));
        label.appendChild(date);
        var message = document.createElement("span");
        message.className = "label-message";
        message.appendChild(document.createTextNode(getDisplayTitle(todo)));
        //message.appendChild(document.createTextNode(todo.title));
        label.appendChild(message);
        label.addEventListener('dblclick', todoDblClicked.bind(this, todo));
        label.addEventListener('click', todoClicked.bind(this, todo));

        var deleteLink = document.createElement('button');
        deleteLink.className = 'destroy';
        deleteLink.addEventListener( 'click', deleteButtonPressed.bind(this, todo));

        var endDateLink = document.createElement('button');
        endDateLink.className = 'endDate';
        endDateLink.addEventListener( 'click', endDateButtonPressed.bind(this, todo));


        var divDisplay = document.createElement('div');
        divDisplay.className = 'view';
        divDisplay.appendChild(checkbox);
        divDisplay.appendChild(label);
        divDisplay.appendChild(deleteLink);
        divDisplay.appendChild(endDateLink);

        var inputEditTodo = document.createElement('input');
        inputEditTodo.id = 'input_' + todo._id;
        inputEditTodo.className = 'edit';
        inputEditTodo.value = todo.title;
        inputEditTodo.addEventListener('keypress', todoKeyPressed.bind(this, todo));
        inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo));

        var li = document.createElement('li');
        li.id = 'li_' + todo._id;
        li.appendChild(divDisplay);
        li.appendChild(inputEditTodo);

        if (todo.completed) {
            li.className += 'complete';
            checkbox.checked = true;
        }

        return li;
    }

    function redrawTodosUI(todos) {
        if (todos.length > 0) {
            var ul = document.getElementById('todo-list');
            ul.innerHTML = '';
            todos.forEach(function(todo) {
                ul.appendChild(createTodoListItem(todo.doc));
            });
        } else {
            $('#todo-list').html('<div id="no-tasks">No Tasks Found For ' + appconfig.runtime.curMonth + '.</div>');
        }
        $('#new-todo').focus();
    }

    function newTodoKeyPressHandler( event ) {
        if (event.keyCode === ENTER_KEY) {
            addTodo(newTodoDom.value);
            newTodoDom.value = '';
        }
    }

    function addEventListeners() {
        newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
        var saveButton = document.getElementById("editorsave");
        saveButton.addEventListener('click', saveButtonClicked, false);
        var doneButton = document.getElementById("editordone");
        doneButton.addEventListener('click', doneButtonClicked, false);
    }

    function generateMenu(yyyy, menuvalues) {
        var source   = $("#menu-template").html();
        var template = Handlebars.compile(source);
        var months   = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        var context  = {
            months : []
        };
        for (var i = 1; i <= 12; i++) {
            var record = {};
            if (i < 10) {
                record = {
                    id   : "0" + i + "-" + yyyy,
                    text : months[i - 1] + "/" + yyyy
                };
            } else {
                record = {
                    id   : i + "-" + yyyy,
                    text : months[i - 1] + "/" + yyyy
                };
            }
            //if (record.id == moment(new Date()).format("MM-YYYY")) {
            if (record.id == appconfig.runtime.curMonth) {
                record.is_today = true;
            }
            context.months.push(record);
        }

        var html     = '<a class="pure-menu-heading">' + yyyy + '</a>' + template(context);
        $(menuvalues).append(html);
        $(document).on('click', '.pure-menu li a', function(e) {
            $(this).parent().parent().find('.pure-menu-selected').removeClass('pure-menu-selected');
            var a = $(this).attr('id').split('_')[1];
            appconfig.runtime.curMonth = a;
            $(this).parent().toggleClass('pure-menu-selected');
            closeEditor();
            showTodos();
        });
    }

    var yyyy =  moment(new Date()).format("YYYY");
    generateMenu(parseInt(yyyy, 10) - 1, '#menu-values-prev');
    generateMenu(yyyy, '#menu-values-now');
    generateMenu(parseInt(yyyy, 10) + 1, '#menu-values-next');
    addEventListeners();
    showTodos();

    if (remoteCouch) {
        sync();
    }
})();
