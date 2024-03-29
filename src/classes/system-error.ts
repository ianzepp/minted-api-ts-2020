import util from 'util';

export class SystemError extends Error {
    static UNIMPLEMENTED = 'unimplemented: This method is currently unimplemented';
    static UNINITIALIZED = 'uninitialized: This object has not been properly initialized';
    static UNSUPPORTED = 'unsupported: This method is currently unimplemented: %j';
    static UNSUPPORTED_DATA_TYPE = 'unsupported-data-type';

    constructor(readonly code: number = 500, message: string = 'System error', ... params: any) {
        super(util.format(message, ... params));
    }

    static testInitialized(test: any) {
        return SystemError.test(test, 500, SystemError.UNINITIALIZED);
    }

    static test404(test: any) {
        return SystemError.test(test, 404, 'Record not found');
    }

    static test(test: any, code: number, message: string, ... params: any) {
        if (test === undefined) {
            throw new SystemError(code, message, params);
        }

        else {
            return test;
        }
    }
}
