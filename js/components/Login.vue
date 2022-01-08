<template>
    <div v-if="isNotLogged" class="Login">
        <div>
            <div class="WindowsLoader__logo">
                <img src="images/logo.png">
            </div>

            <div class="text-center">
                <form v-show="serverStatus != 'red'" method="post">
                    <label>Username</label>
                    <input name="username" placeholder="Username" type="text" class="form-control" required>
                    
                    <label>Password</label>
                    <input name="password" placeholder="*****" type="password" class="form-control" required>
                    
                    <button class="btn btn-primary mt-2">Login</button>
                </form>
                <div class="Login__ServerStatus mt-3">Server status: <span :class="serverStatus"></span></div>
            </div>
        </div>

    </div>
</template>

<script>
    import { mapActions } from 'vuex';
    import * as Api from '../services/api'
    import Socket from '../services/socket'

    export default {
        data () {
            return {
                isNotLogged: true,
                serverStatus: "orange"
            };
        },
        mounted() {
            document.addEventListener("server-status", (status) => {
                switch (status.detail.status) {
                    case 1: // connected
                        this.serverStatus = "green";
                        break;
                    case 2: // disconnected
                        this.serverStatus = "red";
                        break;
                    case 3: // rebooting
                        this.serverStatus = "orange";
                        break;
                }
            });
            document.addEventListener("logout", () => {
                this.isNotLogged = true;
            });

            const user = localStorage.getItem("user");

            if (user !== null) {
                Socket.connect().then(()=> {
                    this.setUser(user);
                    this.isNotLogged = false;
                });
                return;
            }

            const $form = document.querySelector(".Login form");
            $form.addEventListener("submit", (e) => {
                e.preventDefault();

                const username = $form.querySelector('[name="username"]').value;
                const password = $form.querySelector('[name="password"]').value;

                Api.request("login", JSON.stringify({username, password}), Api.METHOD_POST).then(response => {
                    localStorage.setItem("token", response.message.token);
                    localStorage.setItem("user", JSON.stringify(response.message));
                    
                    Socket.connect().then(()=> {
                        this.setUser(response.message);
                        this.isNotLogged = false;
                    });
                });
            });
        },
        methods: {
            ...mapActions([
                'setUser',
            ]),
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
 .Login {
    z-index: 999;
    position: fixed;
    background:black;
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;

    &__ServerStatus {
        color: white;
    }

    &__ServerStatus span {
        width: 11px;
        height: 11px;
        display: inline-block;
        border-radius: 4px;
    }
    &__ServerStatus span.orange {
        background: orange;
    }
    &__ServerStatus span.green {
        background: green;
    }
    &__ServerStatus span.red {
        background: red;
    }
 }
 .form-control {
    display: block;
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #212529;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid #ced4da;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    border-radius: 0.25rem;
    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
 }
 .text-center {
    text-align: center;
 }
 .btn {
    display: inline-block;
    font-weight: 400;
    line-height: 1.5;
    color: #212529;
    text-align: center;
    text-decoration: none;
    vertical-align: middle;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    background-color: transparent;
    border: 1px solid transparent;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    border-radius: 0.25rem;
    transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}
.btn-primary {
    color: #fff;
    background-color: #0d6efd;
    border-color: #0d6efd;
}
.mt-2 {
    margin-top: 0.5rem!important;
}
.mt-3 {
    margin-top: 1rem!important;
}
.d-none {
    display: none;
}
</style>