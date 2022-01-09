<template>
    <program class="FileExplorer Program--autoHeight" title="File Explorer">
        <template slot="menu">
            <div>
                File
            </div>
            <div>
                Home
            </div>
            <div>
                Share
            </div>
            <div>
                View
            </div>
        </template>

        <template slot="content">
            <div class="FileExplorer__nav">
                <div class="FileExplorer__nav__button" :class="{'FileExplorer__nav__button--disabled': ! canGoBack}" @click="goBack">
                    <i class="icon ion-ios-arrow-left"></i>
                </div>
                <div class="FileExplorer__nav__button FileExplorer__nav__button--disabled">
                    <i class="icon ion-ios-arrow-right"></i>
                </div>

                <!--<img class="FileExplorer__nav__button" src="images/arrow.png">-->
                <!--<img class="FileExplorer__nav__button" src="images/arrow.png">-->
                <!--<img class="FileExplorer__nav__button" src="images/downArrow.png">-->
                <!--<img class="FileExplorer__nav__button" src="images/arrow.png">-->

                <div class="FileExplorer__breadcrumb">
                    <!--Quick Access-->

                    <span v-for="folder in breadcrumb" :key="`breadcrumb-${folder.path}`"
                          @click="openFolder(folder.path)">
                        {{ folder.name }}
                    </span>
                </div>

                <!--<div class="FileExplorer__nav__button">-->
                    <!--Search-->
                <!--</div>-->
            </div>

            <div class="FileExplorer__main" @contextmenu="showLeftMenu()">
                <div class="FileExplorer__sidebar">
                    <ul v-for="mainFolder, key in mainFolders"
                        class="FileExplorer__sidebar__folder"
                        :class="{'FileExplorer__sidebar__folder--active': currentMainFolder === mainFolder}"
                        :key="key"
                        @click="openFolder(mainFolder)">
                        <li>{{ mainFolder }}</li>
                    </ul>
                </div>

                <div class="FileExplorer__content"
                     @click.self="focusFile(null)"
                     :class="{'FileExplorer__content--empty': isEmpty}">
                    <div v-if="isEmpty">
                        This folder is empty.
                    </div>

                    <div v-else
                         v-for="file in folderFiles"
                         :key="`${currentFolderName}-${file.name}`"
                         class="FileExplorer__content__file"
                         :class="{'FileExplorer__content__file--active': focusedFile && focusedFile.name === file.name}"
                         @contextmenu="showLeftMenu(file)"
                         @dragstart="startDragging(file.name)"
                         @dragover="allowDrop"
                         @drop="moveFile"
                         @click="focusFile(file)"
                         @dblclick="openFile(file)"
                         :data-name="`${file.name}`"
                         draggable="true">
                        <div class="FileExplorer__content__file__icon">
                            <img v-if="file.type === 'image'" :src="`${getIcon(file)}`">
                            <img v-else :src="`${getIcon(file)}`">
                        </div>

                        <div :id="`file-name-${file.ino}`" 
                            v-bind:contenteditable="focusedFile && focusedFile.name === file.name && renameFocusedFile" 
                            @focusout="stopRenaming(file)" 
                            @keydown="onKeyDown"
                            class="FileExplorer__content__file__name">
                            {{ file.name }}
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </program>
</template>

<script>
    import { mapActions, mapGetters } from 'vuex';

    import _ from 'lodash';
    import programMixin from '../../mixins/program'
    import Socket from '../../services/socket'

    export default {
        data() {
            return {
                currentFolderName: null,
                currentFolder: null,
                focusedFile: null,
                draggedFile: null,
                renameFocusedFile: false,
                directorySeparator: null
            }
        },
        props: {
            'filesTree': {
                type: Array
            }
        },
        mixins: [programMixin],
        mounted() {
            document.querySelector('.Program.FileExplorer').addEventListener("refresh", () => {
                this.refresh();
            });
            document.addEventListener("keydown", (e) => {
                if (this.renameFocusedFile) {
                    return;
                }
                if (e.code == "Delete" && this.focusedFile) {
                    this.delete(this.focusedFile);
                }
            });

            Socket.request("ls", {
                folder: '/'
            }).then(files => {
                this.currentFolder = {
                    name: "/",
                    childs: files
                };
            });
        },
        computed: {
            ...mapGetters([
                'getFileType',
                'getIcon',
                'files'
            ]),
            breadcrumb() {
                if (!this.currentFolder) {
                    return [];
                }
                const separator = this.getDirectorySeparator();
                const parts = this.currentFolder.name.split(separator);
                let folders = [];
                let filledParts = [];

                parts.forEach(part => {
                    if (part.length == 0) {
                        return;
                    }
                    filledParts.push(part);

                    folders.push({
                        name: part,
                        path: filledParts.join(separator)
                    });
                });
                console.log(folders);

                return folders;
            },
            isEmpty() {
                return ! this.folderFiles || this.folderFiles.length === 0
            },
            folderFiles() {
                if (this.currentFolder) {
                    return this.currentFolder.childs;
                }

                return [];
            },
            currentMainFolder() {
                if (! this.currentFolder) {
                    return null;
                }

                return this.breadcrumb[0];
            },
            mainFolders() {
                const folders = [];

                _.each(this.files, folder => {
                    folders.push(folder.name);
                });

                return folders;
            },
            canGoBack() {
                return this.currentFolder && this.currentFolder.name.length > 1;
            }
        },
        methods: {
            ...mapActions([
                'runProgram',
            ]),
            focusFile(focusedFile) {
                this.focusedFile = focusedFile;
            },
            getDirectorySeparator () {
                if (this.directorySeparator != null) {
                    return this.directorySeparator;
                }
                const user = JSON.parse(localStorage.getItem("user"));

                switch (user.platform) {
                    case "win32":
                        this.directorySeparator = "\\";
                        break;
                    default:
                        this.directorySeparator = "/";
                        break;
                }
                return this.directorySeparator;
            },
            goBack() {
                this.renameFocusedFile = false;
                const directorySeparator = this.getDirectorySeparator();
                const parts = this.currentFolder.name.split(directorySeparator);
                
                // is trying to head back to root folder
                // E:\\ -> ["E:", ""]
                if (parts.length === 2 && 
                    parts[0].endsWith(':') && 
                    parts[1].length === 0) {
                    parts[0] = '/';
                }
                
                parts.pop();
                
                let previousPath = ((parts.length == 1 && parts[0] == "/") || parts.length === 0) ? "/" : parts.join(directorySeparator);

                this.openFolder(previousPath);
            },
            openFile(file) {
                if (file.action) {
                    return file.action(file);
                }

                const type = file.type || this.getFileType(file);

                switch (type) {
                    case 'audio':
                        this.runProgram({
                            name: 'AudioPlayer',
                            props: {
                                'source': file.src,
                                'name': file.name,
                            }
                        });

                        break;
                    case 'text':
                        this.runProgram({
                            name: 'Notepad',
                            props: {
                                'content': file.text,
                                'name': file.name,
                            }
                        });

                        break;
                    case 'image':
                        this.runProgram({
                            name: 'PhotoViewer',
                            props: {
                                'source': file.src,
                                'name': file.name,
                            }
                        });
                        break;
                    case 'video':
                        this.runProgram({
                            name: 'VideoPlayer',
                            props: {
                                'source': file.src,
                                'name': file.name,
                                options: {
                                    mode: 'maximized'
                                }
                            }
                        });
                        break;
                    case 'folder':
                        this.openFolder(file.path);
                        break;
                    default:
                        break;
                }
            },
            openFolder(filePath) {
                return new Promise((resolve, reject) => {
                    this.renameFocusedFile = false;

                    Socket.request("ls", {
                        folder: filePath
                    }).then(files => {
                        this.focusedFile = null;
                        this.currentFolder = {
                            name: filePath,
                            childs: files
                        };
                        resolve();
                    });
                });
            },
            moveFile(e) {
                this.renameFocusedFile = false;
                const targetFolder = e.target.closest('[draggable="true"]').dataset.name;
                let originFile = null;
                let destinationFolder = null;

                this.folderFiles.forEach(file => {
                    if (file.name == this.draggedFile) {
                        originFile = file;
                    } else if (file.name == targetFolder) {
                        destinationFolder = file;
                    }
                });

                // dragging a file over another file is not supported :S
                if (!destinationFolder || !destinationFolder.directory) {
                    return;
                } 

                // it should display a confirmation popup before moving an entire folder
                if (originFile.directory) {
                    return;
                }

                this.runProgram({
                    name: 'FileMover',
                    props: {
                        'origin': originFile,
                        'destination': destinationFolder,
                    }
                });
            },
            allowDrop(e) {
                e.preventDefault();
            },
            startDragging(file) {
                this.renameFocusedFile = false;
                this.draggedFile = file;
            },
            refresh () {
                return this.openFolder(this.currentFolder.name);
            },
            rename (file) {
                this.focusFile(file);
                this.renameFocusedFile = true;

                const $name = this.getFileLabel(file);

                $name.focus();
                setTimeout(() => {
                    $name.focus();
                }, 200);
            },
            getFileLabel (file) {
                return document.getElementById('file-name-' + file.ino);
            },
            stopRenaming(file) {
                if (!this.renameFocusedFile) {
                    return;
                }
                this.renameFocusedFile = false;
                const $name = this.getFileLabel(file);
                const newName = $name.innerText;

                if (newName == file.name) { // no changes were made
                    return;
                }
                
                Socket.request("mv", {
                    origin: file.path,
                    destination: file.path.replace(file.name, newName)
                }).then(result => {
                    this.refresh();
                });
            },
            onKeyDown (e) {
                if (!e.target.contentEditable) {
                    return;
                }
                if (e.code == "Enter") {
                    e.preventDefault();
                    this.stopRenaming(this.focusedFile);
                }
            },
            newFolder() {
                const pathSeparator = this.getDirectorySeparator();
                const folderName = "new-folder-" + (new Date()).getTime();

                Socket.request("mkdir", {
                    path: [this.currentFolder.name, folderName].join(pathSeparator),
                }).then(file => {
                    this.refresh().then(() => {
                        this.rename(file);
                    });
                });
            },
            delete(file) {
                if (typeof file === 'undefined') {
                    if(this.focusedFile) {
                        file = this.focusedFile;
                    } else {
                        console.log("delete method called without required argument");
                        return;
                    }
                }
                Socket.request("rm", {
                    path: file.path,
                }).then(result => {
                    this.refresh();
                });
            },
            showLeftMenu (file) {
                let options = [];

                if (this.focusedFile) {
                    options.push({
                        name: "Rename",
                        action: () => {
                            this.rename(file);
                        }
                    });
                    options.push({
                        name: "Delete",
                        action: () => {
                            this.delete(file);
                        }
                    });
                    options.push({
                        name: "Properties",
                        action: () => {
                        }
                    });
                } else {
                    options.push({
                        name: "New folder",
                        action: () => {
                            this.newFolder();
                        }
                    });
                    options.push({
                        name: "Refresh",
                        action: () => {
                            this.refresh();
                        }
                    });
                }

                document.querySelector('.ContextMenu').dispatchEvent(new CustomEvent("show", {
                    detail: {
                        options: options
                    }
                }));
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    .FileExplorer {
        &__breadcrumb {
            display: flex;
            margin-left: 1em;
            padding: .9em 0;

            span {
                cursor: pointer;
                white-space: nowrap;
                margin-right: .5em;

                &:before {
                    font-family: 'Ionicons';
                    margin: 0 .5em;
                    content: '\f3d3';
                }

                &:first-child {
                    &:before {
                        margin: 0;
                        content: ''
                    }
                }

                &:hover {
                    color: rgba(0, 128, 252, 0.6);
                }
            }
        }

        .Program__content {
            display: flex;
            flex-direction: column;
        }

        &__nav {
            display: flex;
            align-items: center;
            flex-direction: row;
            font-size: .8em;
            background: #F2F2F2;
            border-bottom: 1px solid #ccc;

            img {
                position: relative;
                height:100%;
                max-height: 1em;
            }

            &__button {
                font-size: 2em;
                padding: .2em;
                width: 39px;
                text-align: center;
                cursor: pointer;

                &--disabled {
                    opacity: .1;
                    cursor: default;
                }

                &:hover {
                    background: #CCCCCC;
                }
            }
        }

        &__main {
            display: flex;
            overflow: auto;
            min-height: 400px;
            flex: 1;

            ul {
                list-style-type: none;
            }
        }

        &__content {
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            margin: .2em;

            &__file {
                width: 100px;
                height: 100px;
                cursor: pointer;
                overflow: hidden;
                margin: .6em;

                &--active {
                    background: rgba(0, 128, 252, 0.3);
                }

                [contenteditable=true] {
                    background: white;
                }

                &__icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    width: 100%;
                    height: 45px;

                    img {
                        max-width: 40px;
                    }
                }

                &__name {
                    text-align: center;
                    word-wrap: break-word;
                }
            }

            &--empty {
                width: 100%;
                align-items: center;
                justify-content: center;
                text-align: center;
                color: #ccc;
            }
        }

        &__sidebar{
            min-height: 100%;
            min-width: 10em;
            border-right:.1em solid lightgray;
            overflow: hidden;

            ul {
                margin: 0 auto;
                padding-left: 1.5em;
                line-height: 2em;
                height: 2em;
                cursor: pointer;
            }

            &__folder {
                &:hover {
                    background: rgba(0,128,252,.45);
                }

                &--active {
                    background: rgba(0,128,252,.3);
                }
            }
        }
    }
</style>