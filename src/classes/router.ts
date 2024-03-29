import _ from 'lodash';
import assert from 'assert';
import * as Http from 'http';
import { pathToRegexp, match } from 'path-to-regexp';

// API
import { System } from '../classes/system';

export interface RouterResult {
    method: string | undefined,
    path: string | undefined,
    code: number,
    data: any
}

export abstract class Router {
    // Stores the discovered path params
    private _params: _.Dictionary<string> | undefined;
    private _search: _.Dictionary<any> | undefined;
    private _change: _.Dictionary<any> | Array<_.Dictionary<any>> | undefined;

    constructor(readonly system: System, readonly req: Http.IncomingMessage, readonly res: Http.ServerResponse) {

    }

    /** Returns the evaluated named parameters */
    get params(): _.Dictionary<string> {
        return this._params ?? (this._params = this._to_params());
    }

    /** Returns the search data (from either the URL or the body) */
    get search(): _.Dictionary<any> {
        return this._search ?? (this._search = this._to_search());
    }

    /** Returns the change data from the HTTP body (either an object or an array) */
    get change_data(): _.Dictionary<any> {
        assert(this._change instanceof Array === false);
        return this._change;
    }

    get change_list(): _.Dictionary<any>[] {
        assert(this._change instanceof Array);
        return this._change;;
    }

    /** Executes the router `run()` method, wrapped in a try/catch block */
    async runsafe() {
        let result: RouterResult = {
            method: this.req.method,
            path: this.req.url || '/',
            code: 0,
            data: null
        }

        try {
            // Run the router validation, followed by the implementation
            let data = await this.system.knex.transact(async () => {
                return this.validate().then(() => this.run());
            });

            // Save the results
            result.data = data;
            result.code = 200;
        }

        catch (error) {
            console.error(error);

            // Save the result error
            result.data = error.message;
            result.code = error.code || 500;
        }

        return result;
    }

    /** Defines the router validation code (if any) */
    async validate(): Promise<any> {
        // no default implementation
    }

    /** Defines the code to be executed. */
    async run(): Promise<any> {
        // no default implementation
    }

    /** Returns `true` if this request is an HTTP OPTION request */
    isOption() {
        return this.req.method === 'OPTION';
    }

    /** Returns `true` if this request is an HTTP GET request */
    isSelect() {
        return this.req.method === 'GET';
    }

    /** Returns `true` if this request is an HTTP POST request */
    isCreate() {
        return this.req.method === 'POST';
    }

    /** Returns `true` if this request is an HTTP PATCH request */
    isUpdate() {
        return this.req.method === 'PATCH';
    }

    /** Returns `true` if this request is an HTTP PUT request */
    isUpsert() {
        return this.req.method === 'PUT';
    }

    /** Returns `true` if this request is an HTTP DELETE request */
    isDelete() {
        return this.req.method === 'DELETE';
    }

    /** Returns the target router path, along with named parameters (eg, "/api/data/:schema/:id?") */
    onRouterPath() {
        return '/';
    }

    /** Returns `true` if the request route matches this router */
    isRouterPath() {
        return pathToRegexp(this.onRouterPath()).exec(this.req.url ?? '/') !== null;
    }

    /** Returns `true` if the router should be executed in a `root` context. Defaults to `true` */
    onRoot() {
        return true;
    }

    /** Returns `true` if the router should be executed in a `user` context. Defaults to `true` */
    onUser() {
        return true;
    }

    /** Returns `true` if the router should run under a `select` context. Defaults to `false` */
    onSelect() {
        return false;
    }

    /** Returns `true` if the router should run under a `create` context. Defaults to `false` */
    onCreate() {
        return false;
    }

    /** Returns `true` if the router should run under a `update` context. Defaults to `false` */
    onUpdate() {
        return false;
    }

    /** Returns `true` if the router should run under a `upsert` context. Defaults to `false` */
    onUpsert() {
        return false;
    }

    /** Returns `true` if the router should run under a `select` context. Defaults to `false` */
    onDelete() {
        return false;
    }

    /** Returns `true` if the router should be executed (at all). Defaults to `true` */
    isRunnable() {
        return true;
    }

    //
    // Private helpers
    //

    private _parse_url() {
        return new URL('http://localhost' + this.req.url);
    }

    private _to_params(): _.Dictionary<any> {
        return _.get(match(this.onRouterPath())(this._parse_url().pathname), 'params') || {};
    }

    private _to_search(): _.Dictionary<any> {
        return this._parse_url().searchParams;
    }

    private _to_change(): Array<_.Dictionary<any>> {
        return []; // TODO - implement body data
    }
}
