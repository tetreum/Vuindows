
export const METHOD_GET = "get";
export const METHOD_POST = "post";
export const BASE_URL = location.origin.replace("8080", "8081") + '/api/';

export const request = (route, params, method) => {

    if (typeof params === "undefined" || params == null) {
        params = {};
    }
    if (typeof method === "undefined" || method == null) {
        method = this.METHOD_GET;
    }

    return new Promise((resolve, reject) => {

        let request = {
            method: method,
            mode: 'cors'
        };

        let paramList;

        // json body or already a FormData
        if (params instanceof FormData || typeof params === "string") {
            if (typeof params === "string") {
                request.headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };
            }
            paramList = params;
        } else {
            if (method === METHOD_POST) {
                paramList = new FormData();
            } else {
                paramList = new URLSearchParams();
            }
    
            for (var k in params) {
                if (!params.hasOwnProperty(k)) {continue;}
                paramList.append(k, params[k]);
            }
        }

        if (method === "post") {
            request.body = paramList;
        } else {
            route = route + "?" + paramList;
        }

        fetch(BASE_URL + route, request)
            .then(response => response.json().then((response) => {
            
                if (response === "" || typeof response != "object" || typeof response.error === "undefined"  || isNaN(response.error)) {
                    return reject("internal error");
                }
            
                if (response.error > 0) {
                    return reject(response);
                }
            
                resolve(response);
            }))
            .catch(error => reject(error));
    });
};