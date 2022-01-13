import store from '../index';
import _ from 'lodash';

// initial state
const state = [];

// getters
const getters = {
    files: state => state,
    getFileType: () => file => {
        return file.directory ? 'folder' : file.name.split('.').pop();
    },
    getIcon: (state, getters) => file => {
        const type = getters.getFileType(file);

        switch (type) {
            case 'zip':
            case 'rar':
            case '7z':
                return 'images/filetypes/zip.png';
            case 'css':
            case 'scss':
                return 'images/filetypes/css.png';
            case 'js':
                return 'images/filetypes/js.png';
            case 'html':
            case 'htm':
                return 'images/filetypes/html.png';
            case 'mp3':
            case 'ogg':
                return 'images/filetypes/audio.png';
            case 'txt':
                return 'images/filetypes/file.png';
            case 'jpg':
            case 'png':
            case 'jpeg':
            case 'webp':
            case 'gif':
            case 'ico':
                return 'images/filetypes/image.png';
            case 'mp4':
            case 'webm':
            case 'mkv':
            case 'flv':
            case 'avi':
            case 'wmv':
            case 'mov':
            case 'mpg':
            case 'm4v':
            case '3gp':
            case 'ts':
            case 'mts':
            case 'vob':
                return 'images/filetypes/video.png';
            case 'folder':
                return file.name.endsWith(":") ? 'images/filetypes/drive.png' : 'images/filetypes/folder.png';
            case 'exe':
                return 'images/filetypes/executable.png';
            default:
                return 'images/filetypes/file.png';
        }
    },
};

// actions
const actions = {
    setFiles({ commit }, files) {
        commit('setFiles', files);
    },
};

// mutations
const mutations = {
    setFiles(state, files) {
        state.files = files;
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
