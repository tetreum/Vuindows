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
            case 'audio':
                return 'images/filetypes/audio.png';
            case 'text':
                return 'images/filetypes/file.png';
            case 'image':
                return file.src;
            case 'video':
                return 'images/filetypes/video.png';
            case 'folder':
                return 'images/filetypes/folder.png';
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
