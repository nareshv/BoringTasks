<?php require_once './config.php'; ?>
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title><?php echo $CONFIG['username']; ?> • Tasks</title>
        <link href='http://fonts.googleapis.com/css?family=Lato' rel='stylesheet' type='text/css'>
        <link rel="stylesheet" href="http://yui.yahooapis.com/pure/0.4.2/pure-min.css">
        <link rel="stylesheet" href="style/base.css">
        <link rel="stylesheet" href="style/pure-buttons.css">
        <!--[if IE]>
        <script src="style/ie.js"></script>
        <![endif]-->
    </head>
    <body>
        <div id="main">
            <h1><?php echo $CONFIG['username']; ?>'s Tasks</h1>
        </div>
        <div class="pure-g">
            <div class="pure-u-2-24">
                <div class="pure-menu pure-menu-open" id="menu-values-prev"></div>
            </div>
            <div class="pure-u-2-24">
                <div class="pure-menu pure-menu-open" id="menu-values-now"></div>
            </div>
            <div class="pure-u-2-24">
                <div class="pure-menu pure-menu-open" id="menu-values-next"></div>
            </div>
            <div class="pure-u-18-24" id="v2">
                <section id="todoapp" class="grid3">
                    <header id="header">
                        <input id="new-todo" placeholder=">>> What needs to be done ?" autofocus>
                    </header>
                    <section id="main">
                        <ul id="todo-list"></ul>
                    </section>
                    <footer id="footer">
                        <span id="todo-count"></span>
                        <div id="sync-wrapper">
                            <div id="sync-success">
                                <img src="images/connected-24x24.png" alt="Connected ...">
                                <span>connected &amp; syncing with remote instance ...</span>
                            </div>
                            <div id="sync-error">
                                <img src="images/disconnected-24x24.png" alt="There was a problem syncing">
                                <span>disconnected from remote couchdb instance ...</span>
                            </div>
                        </div>
                    </footer>
                </section>
            </div>
            <div class="pure-u-6-24 hidden" id="v3">
                <section id="editor" class="grid3">
                    <h3 id="editortitle"></h3>
                    <div id="epiceditor"></div>
                    <hr>
                    <div>
                        <button id="editorsave" class="pure-button pure-button-primary">Save Notes</button>
                        <button id="editordone" class="pure-button button-success">Done</button>
                    </div>
                </section>
            </div>
        </div>
        <footer id="info">
            <p>Double-click to edit a todo</p>
        </footer>
        <script id="menu-template" type="text/x-handlebars-template">
<ul>
{{#each months}}
    {{#if is_today}}
    <li class="pure-menu-selected"><a href="#" id="month_{{id}}">{{text}}</a></li>
    {{else}}
    <li><a href="#" id="month_{{id}}">{{text}}</a></li>
    {{/if}}
{{/each}}
</ul>
        </script>
        <script src="js/jquery-2.1.0.min.js"></script>
        <script src="js/handlebars-v1.3.0.js"></script>
        <script src="epiceditor/js/epiceditor.min.js"></script>
        <script src="js/moment.min.js"></script>
        <script src="js/pouchdb-6.0.7.min.js"></script>
        <script src="js/app.js"></script>
    </body>
</html>
