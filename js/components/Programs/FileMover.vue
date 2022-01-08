<template>
    <program class="FileMover Program--autoHeight" title="Moving file">
        <template slot="content">
            <div class="FileMover__container">
                <p>Preparing to move <span class="color-blue">{{ origin.name }}</span> to <span class="color-blue">{{ destination.path }}</span></p>
                <progress value="32" max="100"> 32% </progress>
            </div>
        </template>
    </program>
</template>

<script>

    import { mapActions, mapGetters } from 'vuex';
    import programMixin from '../../mixins/program'
    import Socket from '../../services/socket'

    export default {
        data() {
            return {
            }
        },
        props: ['origin', 'destination'],
        mixins: [programMixin],
        mounted() {
            Socket.request("mv", {
                origin: this.origin.path,
                destination: this.destination.path,
            }).then(response => {
                document.querySelector('.Program.FileExplorer').dispatchEvent(new Event("refresh"));
                this.terminateProgram(this.id);
            });
        },
        methods: {
            ...mapActions([
                'terminateProgram',
            ]),
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    .FileMover {
        width: 30vw;

        &__container {
            padding: 20px;
        }
    }

    .color-blue {
        color: #0066cc;
    }

    progress {
        /* Reset the default appearance */
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;

        width: 100%;
        height: 20px;

        border: 1px solid #bcbcbc;
        background: #EEE;
        border-radius: 3px;
    }

    progress::-webkit-progress-bar {
        background: #EEE;
        border-radius: 3px;
    }

    progress::-webkit-progress-value {
        background-color: #0ab128;
        border-radius: 3px;
    }

    progress::-moz-progress-bar {
        background-color: #0ab128;
        border-radius: 3px;
    }


</style>