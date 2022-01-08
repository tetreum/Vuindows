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

                    <span v-for="item, key in breadcrumb"
                          @click="goToFolderFromBreadcrumb(key)">
                        {{ item }}
                    </span>
                </div>

                <!--<div class="FileExplorer__nav__button">-->
                    <!--Search-->
                <!--</div>-->
            </div>

            <div class="FileExplorer__main">
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
                         :class="{'FileExplorer__content__file--active': focusedFile === file.name}"
                         @dragstart="startDragging(file.name)"
                         @dragover="allowDrop"
                         @drop="moveFile"
                         @click="focusFile(file.name)"
                         @dblclick="openFile(file)"
                         :data-name="`${file.name}`"
                         draggable="true">
                        <div class="FileExplorer__content__file__icon">
                            <img v-if="file.type === 'image'" :src="`${getIcon(file)}`">
                            <img v-else :src="`${getIcon(file)}`">
                        </div>

                        <div class="FileExplorer__content__file__name">{{ file.name }}</div>
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
                breadcrumb: [],
                focusedFile: null,
                draggedFile: null,
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

            Socket.request("ls", {
                folder: 'C:\\'
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
                'setFiles',
            ]),
            focusFile(focusedFile) {
                this.focusedFile = focusedFile;
            },
            goToFolderFromBreadcrumb(key) {
                _.each(this.breadcrumb, (name, index) => {
                    this.openFolder(name);

                    if (index === key) {
                        return false;
                    }
                })
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
                const directorySeparator = this.getDirectorySeparator();
                const parts = this.currentFolder.name.split(directorySeparator);
                parts.pop();
                let previousPath = parts.join(directorySeparator);

                // fix windows root letter, as C: != C:\\ to node.
                if (parts.length == 1 && !(previousPath.includes(directorySeparator))) {
                    previousPath += directorySeparator;
                }

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
            getCurrentFolder() {
                let currentFolder;

                // Maybe SubFolder
                if (this.currentFolder && this.currentFolder.childs) {
                    currentFolder = this.currentFolder.childs.find(folder => {
                        return folder.name === this.currentFolderName;
                    });

                    if (currentFolder) {
                        this.breadcrumb.push(currentFolder.name);
                    }
                }

                // Not a subFolder, try to find a toplevel
                if (! currentFolder) {
                    currentFolder = this.files.find(folder => {
                        return folder.name === this.currentFolderName;
                    });

                    if (currentFolder) {
                        this.breadcrumb = [currentFolder.name];
                    }
                }

                if (! currentFolder) {
                    return [];
                }

                return currentFolder;
            },
            openFolder(filePath) {
                Socket.request("ls", {
                    folder: filePath
                }).then(files => {
                    this.currentFolder = {
                        name: filePath,
                        childs: files
                    };
                });
            },
            moveFile(e) {
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
                this.draggedFile = file;
            },
            refresh () {
                this.openFolder(this.currentFolder.name);
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