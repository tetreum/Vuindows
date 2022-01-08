<template>
    <ul class="ContextMenu custom-menu" v-show="show">
        <li v-for="option, index in options" @click="clickOption(option)" :key="index">
            {{ option.name }}
        </li>
    </ul>
</template>

<script>
    export default {
        data () {
            return {
                show: false,
                options: []
            }
        },
        mounted() {
            const $customMenu = document.querySelector(".custom-menu");
            document.addEventListener("contextmenu", (event) => {
                // Avoid the real right click
                event.preventDefault();

                $customMenu.style.top = event.pageY + "px";
                $customMenu.style.left = event.pageX + "px";
            });

            document.querySelector('.ContextMenu').addEventListener("show", (event) => {
                if (event.detail.options.length === 0) {
                    return;
                }

                this.options = event.detail.options;
                this.show = true;
            });


            // If the document is clicked somewhere else
            document.body.addEventListener("mousedown", (e) => {
                if (!(e.target.contains($customMenu)) && !($customMenu.contains(e.target))) {
                    this.options = [];
                    this.show = false;
                }
            });
        },
        methods: {
            clickOption(option) {
                this.show = false;
                option.action();
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">

</style>