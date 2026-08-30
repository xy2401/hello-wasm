// Project adapter: the page downloads and validates the split runtime before
// transferring the complete WebAssembly buffer to the official c2w worker.
var preloadedWasmBuffer;
var serveOfficialInitMsg = serveIfInitMsg;

serveIfInitMsg = function (msg) {
    var request = msg.data;
    if (typeof request === "object" && request !== null && request.type === "init" && request.wasmBuffer) {
        preloadedWasmBuffer = request.wasmBuffer;
        return true;
    }
    return serveOfficialInitMsg(msg);
};

function takePreloadedWasmBuffer() {
    var buffer = preloadedWasmBuffer;
    preloadedWasmBuffer = undefined;
    return buffer;
}
