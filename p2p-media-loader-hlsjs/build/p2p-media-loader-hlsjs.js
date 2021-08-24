require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/**
 * Copyright 2018 Novage LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const hlsjs = __importStar(require("./index"));
if (!window.p2pml) {
    window.p2pml = {};
}
window.p2pml.hlsjs = hlsjs;

},{"./index":"p2p-media-loader-hlsjs"}],2:[function(require,module,exports){
"use strict";
/**
 * Copyright 2018 Novage LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = void 0;
const events_1 = require("events");
const p2p_media_loader_core_1 = require("@webtor/p2p-media-loader-core");
const segment_manager_1 = require("./segment-manager");
const hlsjs_loader_1 = require("./hlsjs-loader");
class Engine extends events_1.EventEmitter {
    constructor(settings = {}) {
        super();
        this.loader = new p2p_media_loader_core_1.HybridLoader(settings.loader);
        this.segmentManager = new segment_manager_1.SegmentManager(this.loader, settings.segments);
        Object.keys(p2p_media_loader_core_1.Events)
            .map((eventKey) => p2p_media_loader_core_1.Events[eventKey])
            .forEach((event) => this.loader.on(event, (...args) => this.emit(event, ...args)));
    }
    static isSupported() {
        return p2p_media_loader_core_1.HybridLoader.isSupported();
    }
    createLoaderClass() {
        var _a;
        const engine = this; // eslint-disable-line @typescript-eslint/no-this-alias
        return _a = class {
                constructor() {
                    this.load = async (context, config, callbacks) => {
                        this.context = context;
                        this.callbacks = callbacks;
                        await this.impl.load(context, config, callbacks);
                    };
                    this.abort = () => {
                        if (this.context) {
                            this.impl.abort(this.context, this.callbacks);
                        }
                    };
                    this.destroy = () => {
                        if (this.context) {
                            this.impl.abort(this.context);
                        }
                    };
                    this.getResponseHeader = () => undefined;
                    this.impl = new hlsjs_loader_1.HlsJsLoader(engine.segmentManager);
                    this.stats = this.impl.stats;
                }
            },
            _a.getEngine = () => {
                return engine;
            },
            _a;
    }
    async destroy() {
        await this.segmentManager.destroy();
    }
    getSettings() {
        return {
            segments: this.segmentManager.getSettings(),
            loader: this.loader.getSettings(),
        };
    }
    getDetails() {
        return {
            loader: this.loader.getDetails(),
        };
    }
    setPlayingSegment(url, byteRange, start, duration) {
        this.segmentManager.setPlayingSegment(url, byteRange, start, duration);
    }
    setPlayingSegmentByCurrentTime(playheadPosition) {
        this.segmentManager.setPlayingSegmentByCurrentTime(playheadPosition);
    }
}
exports.Engine = Engine;

},{"./hlsjs-loader":3,"./segment-manager":4,"@webtor/p2p-media-loader-core":"@webtor/p2p-media-loader-core","events":"events"}],3:[function(require,module,exports){
"use strict";
/**
 * Copyright 2018 Novage LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HlsJsLoader = void 0;
const p2p_media_loader_core_1 = require("@webtor/p2p-media-loader-core");
const DEFAULT_DOWNLOAD_LATENCY = 1;
const DEFAULT_DOWNLOAD_BANDWIDTH = 12500; // bytes per millisecond
class HlsJsLoader {
    constructor(segmentManager) {
        this.isLoaded = false;
        this.stats = {
            trequest: 0,
            tfirst: 0,
            tload: 0,
            tparsed: 0,
            loaded: 0,
            total: 0,
            aborted: false,
            retry: 0,
            chunkCount: 0,
            bwEstimate: 0,
            loading: {
                start: 0,
                end: 0,
                first: 0,
            },
            parsing: {
                start: 0,
                end: 0,
            },
            buffering: {
                start: 0,
                end: 0,
                first: 0,
            },
        };
        this.segmentManager = segmentManager;
    }
    async load(context, _config, callbacks) {
        const start = performance.now();
        this.stats.loading.start = start - DEFAULT_DOWNLOAD_LATENCY;
        this.stats.loading.first = start;
        if (context.type) {
            try {
                const result = await this.segmentManager.loadPlaylist(context.url);
                this.isLoaded = true;
                this.successPlaylist(result, context, callbacks);
            }
            catch (e) {
                this.error(e, context, callbacks);
            }
        }
        else if (context.frag) {
            const { loader } = this.segmentManager;
            const updateBandwidthEstimate = () => {
                const bandwidthEstimate = loader.getBandwidthEstimate();
                // convert bytes per millisecond to bits per second
                this.stats.bwEstimate = bandwidthEstimate * 8000;
                this.stats.loaded = (performance.now() - start) * bandwidthEstimate;
            };
            loader.on(p2p_media_loader_core_1.Events.PieceBytesDownloaded, updateBandwidthEstimate);
            try {
                const result = await this.segmentManager.loadSegment(context.url, getByteRange(context));
                const { content } = result;
                if (content) {
                    this.isLoaded = true;
                    setTimeout(() => this.successSegment(content, result.downloadBandwidth, context, callbacks), 0);
                }
            }
            catch (e) {
                setTimeout(() => this.error(e, context, callbacks), 0);
            }
            finally {
                loader.removeListener(p2p_media_loader_core_1.Events.PieceBytesDownloaded, updateBandwidthEstimate);
            }
        }
        else {
            console.warn("Unknown load request", context);
        }
    }
    abort(context, callbacks) {
        if (this.isLoaded)
            return;
        this.segmentManager.abortSegment(context.url, getByteRange(context));
        this.stats.aborted = true;
        const onAbort = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onAbort;
        if (onAbort) {
            onAbort(this.stats, context, undefined);
        }
    }
    successPlaylist(xhr, context, callbacks) {
        const now = performance.now();
        this.stats.trequest = now - 300;
        this.stats.tfirst = now - 200;
        this.stats.tload = now - 1;
        this.stats.loaded = xhr.response.length;
        this.stats.total = xhr.response.length;
        createUniversalStats(this.stats);
        callbacks.onSuccess({
            url: xhr.responseURL,
            data: xhr.response,
        }, this.stats, context, undefined);
    }
    successSegment(content, downloadBandwidth, context, callbacks) {
        const now = performance.now();
        const downloadTime = content.byteLength /
            (downloadBandwidth === undefined || downloadBandwidth <= 0
                ? DEFAULT_DOWNLOAD_BANDWIDTH
                : downloadBandwidth);
        this.stats.trequest = now - DEFAULT_DOWNLOAD_LATENCY - downloadTime;
        this.stats.tfirst = now - downloadTime;
        this.stats.tload = now - 1;
        this.stats.loaded = content.byteLength;
        this.stats.total = content.byteLength;
        // convert bytes per millisecond to bits per second
        this.stats.bwEstimate = (downloadBandwidth !== null && downloadBandwidth !== void 0 ? downloadBandwidth : DEFAULT_DOWNLOAD_BANDWIDTH) * 8000;
        createUniversalStats(this.stats);
        if (callbacks.onProgress) {
            callbacks.onProgress(this.stats, context, content, undefined);
        }
        callbacks.onSuccess({
            url: context.url,
            data: content,
        }, this.stats, context, undefined);
    }
    error(error, context, callbacks) {
        callbacks.onError(error, context, undefined);
    }
}
exports.HlsJsLoader = HlsJsLoader;
/**
 * Create universal stats entity for both hls.js v0 and v1
 * @param stats hls.js v0 stats
 */
function createUniversalStats(stats) {
    stats.loading.start = stats.trequest;
    stats.loading.first = stats.tfirst;
    stats.loading.end = stats.tload;
}
function getByteRange(context) {
    return context.rangeEnd && context.rangeStart !== undefined
        ? { offset: context.rangeStart, length: context.rangeEnd - context.rangeStart }
        : undefined;
}

},{"@webtor/p2p-media-loader-core":"@webtor/p2p-media-loader-core"}],4:[function(require,module,exports){
"use strict";
/**
 * Copyright 2018 Novage LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentManager = void 0;
const p2p_media_loader_core_1 = require("@webtor/p2p-media-loader-core");
const m3u8_parser_1 = require("m3u8-parser");
const defaultSettings = {
    forwardSegmentCount: 20,
    swarmId: undefined,
    assetsStorage: undefined,
};
class SegmentManager {
    constructor(loader, settings = {}) {
        this.masterPlaylist = null;
        this.variantPlaylists = new Map();
        this.segmentRequest = null;
        this.playQueue = [];
        this.onSegmentLoaded = (segment) => {
            if (this.segmentRequest &&
                this.segmentRequest.segmentUrl === segment.url &&
                byteRangeToString(this.segmentRequest.segmentByteRange) === segment.range) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.segmentRequest.onSuccess(segment.data.slice(0), segment.downloadBandwidth);
                this.segmentRequest = null;
            }
        };
        this.onSegmentError = (segment, error) => {
            if (this.segmentRequest &&
                this.segmentRequest.segmentUrl === segment.url &&
                byteRangeToString(this.segmentRequest.segmentByteRange) === segment.range) {
                this.segmentRequest.onError(error);
                this.segmentRequest = null;
            }
        };
        this.onSegmentAbort = (segment) => {
            if (this.segmentRequest &&
                this.segmentRequest.segmentUrl === segment.url &&
                byteRangeToString(this.segmentRequest.segmentByteRange) === segment.range) {
                this.segmentRequest.onError("Loading aborted: internal abort");
                this.segmentRequest = null;
            }
        };
        this.settings = Object.assign(Object.assign({}, defaultSettings), settings);
        this.loader = loader;
        this.loader.on(p2p_media_loader_core_1.Events.SegmentLoaded, this.onSegmentLoaded);
        this.loader.on(p2p_media_loader_core_1.Events.SegmentError, this.onSegmentError);
        this.loader.on(p2p_media_loader_core_1.Events.SegmentAbort, this.onSegmentAbort);
    }
    getSettings() {
        return this.settings;
    }
    processPlaylist(requestUrl, content, responseUrl) {
        const parser = new m3u8_parser_1.Parser();
        parser.push(content);
        parser.end();
        const playlist = new Playlist(requestUrl, responseUrl, parser.manifest);
        if (playlist.manifest.playlists) {
            this.masterPlaylist = playlist;
            for (const [key, variantPlaylist] of this.variantPlaylists) {
                const { streamSwarmId, found, index } = this.getStreamSwarmId(variantPlaylist.requestUrl);
                if (!found) {
                    this.variantPlaylists.delete(key);
                }
                else {
                    variantPlaylist.streamSwarmId = streamSwarmId;
                    variantPlaylist.streamId = "V" + index.toString();
                }
            }
        }
        else {
            const { streamSwarmId, found, index } = this.getStreamSwarmId(requestUrl);
            if (found || this.masterPlaylist === null) {
                // do not add audio and subtitles to variants
                playlist.streamSwarmId = streamSwarmId;
                playlist.streamId = this.masterPlaylist === null ? undefined : "V" + index.toString();
                this.variantPlaylists.set(requestUrl, playlist);
                this.updateSegments();
            }
        }
    }
    async loadPlaylist(url) {
        const assetsStorage = this.settings.assetsStorage;
        let xhr;
        if (assetsStorage !== undefined) {
            let masterSwarmId;
            masterSwarmId = this.getMasterSwarmId();
            if (masterSwarmId === undefined) {
                masterSwarmId = url.split("?")[0];
            }
            const asset = await assetsStorage.getAsset(url, undefined, masterSwarmId);
            if (asset !== undefined) {
                xhr = {
                    responseURL: asset.responseUri,
                    response: asset.data,
                };
            }
            else {
                xhr = await this.loadContent(url, "text");
                void assetsStorage.storeAsset({
                    masterManifestUri: this.masterPlaylist !== null ? this.masterPlaylist.requestUrl : url,
                    masterSwarmId: masterSwarmId,
                    requestUri: url,
                    responseUri: xhr.responseURL,
                    data: xhr.response,
                });
            }
        }
        else {
            xhr = await this.loadContent(url, "text");
        }
        this.processPlaylist(url, xhr.response, xhr.responseURL);
        return xhr;
    }
    async loadSegment(url, byteRange) {
        var _a;
        const segmentLocation = this.getSegmentLocation(url, byteRange);
        const byteRangeString = byteRangeToString(byteRange);
        if (!segmentLocation) {
            let content;
            // Not a segment from variants; usually can be: init, audio or subtitles segment, encryption key etc.
            const assetsStorage = this.settings.assetsStorage;
            if (assetsStorage !== undefined) {
                let masterManifestUri = (_a = this.masterPlaylist) === null || _a === void 0 ? void 0 : _a.requestUrl;
                let masterSwarmId;
                masterSwarmId = this.getMasterSwarmId();
                if (masterSwarmId === undefined && this.variantPlaylists.size === 1) {
                    const result = this.variantPlaylists.values().next();
                    if (!result.done) {
                        // always true
                        masterSwarmId = result.value.requestUrl.split("?")[0];
                    }
                }
                if (masterManifestUri === undefined && this.variantPlaylists.size === 1) {
                    const result = this.variantPlaylists.values().next();
                    if (!result.done) {
                        // always true
                        masterManifestUri = result.value.requestUrl;
                    }
                }
                if (masterSwarmId !== undefined && masterManifestUri !== undefined) {
                    const asset = await assetsStorage.getAsset(url, byteRangeString, masterSwarmId);
                    if (asset !== undefined) {
                        content = asset.data;
                    }
                    else {
                        const xhr = await this.loadContent(url, "arraybuffer", byteRangeString);
                        content = xhr.response;
                        void assetsStorage.storeAsset({
                            masterManifestUri: masterManifestUri,
                            masterSwarmId: masterSwarmId,
                            requestUri: url,
                            requestRange: byteRangeString,
                            responseUri: xhr.responseURL,
                            data: content,
                        });
                    }
                }
            }
            if (content === undefined) {
                const xhr = await this.loadContent(url, "arraybuffer", byteRangeString);
                content = xhr.response;
            }
            return { content, downloadBandwidth: 0 };
        }
        const segmentSequence = (segmentLocation.playlist.manifest.mediaSequence ? segmentLocation.playlist.manifest.mediaSequence : 0) +
            segmentLocation.segmentIndex;
        if (this.playQueue.length > 0) {
            const previousSegment = this.playQueue[this.playQueue.length - 1];
            if (previousSegment.segmentSequence !== segmentSequence - 1) {
                // Reset play queue in case of segment loading out of sequence
                this.playQueue = [];
            }
        }
        if (this.segmentRequest) {
            this.segmentRequest.onError("Cancel segment request: simultaneous segment requests are not supported");
        }
        const promise = new Promise((resolve, reject) => {
            this.segmentRequest = new SegmentRequest(url, byteRange, segmentSequence, segmentLocation.playlist.requestUrl, (content, downloadBandwidth) => resolve({ content, downloadBandwidth }), (error) => reject(error));
        });
        this.playQueue.push({ segmentUrl: url, segmentByteRange: byteRange, segmentSequence: segmentSequence });
        void this.loadSegments(segmentLocation.playlist, segmentLocation.segmentIndex, true);
        return promise;
    }
    setPlayingSegment(url, byteRange, start, duration) {
        const urlIndex = this.playQueue.findIndex((segment) => segment.segmentUrl === url && compareByteRanges(segment.segmentByteRange, byteRange));
        if (urlIndex >= 0) {
            this.playQueue = this.playQueue.slice(urlIndex);
            this.playQueue[0].playPosition = { start, duration };
            this.updateSegments();
        }
    }
    setPlayingSegmentByCurrentTime(playheadPosition) {
        if (this.playQueue.length === 0 || !this.playQueue[0].playPosition) {
            return;
        }
        const currentSegmentPosition = this.playQueue[0].playPosition;
        const segmentEndTime = currentSegmentPosition.start + currentSegmentPosition.duration;
        if (segmentEndTime - playheadPosition < 0.2) {
            // means that current segment is (almost) finished playing
            // remove it from queue
            this.playQueue = this.playQueue.slice(1);
            this.updateSegments();
        }
    }
    abortSegment(url, byteRange) {
        if (this.segmentRequest &&
            this.segmentRequest.segmentUrl === url &&
            compareByteRanges(this.segmentRequest.segmentByteRange, byteRange)) {
            this.segmentRequest.onSuccess(undefined, 0);
            this.segmentRequest = null;
        }
    }
    async destroy() {
        if (this.segmentRequest) {
            this.segmentRequest.onError("Loading aborted: object destroyed");
            this.segmentRequest = null;
        }
        this.masterPlaylist = null;
        this.variantPlaylists.clear();
        this.playQueue = [];
        if (this.settings.assetsStorage !== undefined) {
            await this.settings.assetsStorage.destroy();
        }
        await this.loader.destroy();
    }
    updateSegments() {
        if (!this.segmentRequest) {
            return;
        }
        const segmentLocation = this.getSegmentLocation(this.segmentRequest.segmentUrl, this.segmentRequest.segmentByteRange);
        if (segmentLocation) {
            void this.loadSegments(segmentLocation.playlist, segmentLocation.segmentIndex, false);
        }
    }
    getSegmentLocation(url, byteRange) {
        for (const playlist of this.variantPlaylists.values()) {
            const segmentIndex = playlist.getSegmentIndex(url, byteRange);
            if (segmentIndex >= 0) {
                return { playlist: playlist, segmentIndex: segmentIndex };
            }
        }
        return undefined;
    }
    async loadSegments(playlist, segmentIndex, requestFirstSegment) {
        var _a;
        const segments = [];
        const playlistSegments = playlist.manifest.segments;
        const initialSequence = (_a = playlist.manifest.mediaSequence) !== null && _a !== void 0 ? _a : 0;
        let loadSegmentId = null;
        let priority = Math.max(0, this.playQueue.length - 1);
        const masterSwarmId = this.getMasterSwarmId();
        for (let i = segmentIndex; i < playlistSegments.length && segments.length < this.settings.forwardSegmentCount; ++i) {
            const segment = playlist.manifest.segments[i];
            const url = playlist.getSegmentAbsoluteUrl(segment.uri);
            const byteRange = segment.byterange;
            const id = this.getSegmentId(playlist, initialSequence + i);
            segments.push({
                id: id,
                url: url,
                masterSwarmId: masterSwarmId !== undefined ? masterSwarmId : playlist.streamSwarmId,
                masterManifestUri: this.masterPlaylist !== null ? this.masterPlaylist.requestUrl : playlist.requestUrl,
                streamId: playlist.streamId,
                sequence: (initialSequence + i).toString(),
                range: byteRangeToString(byteRange),
                priority: priority++,
            });
            if (requestFirstSegment && !loadSegmentId) {
                loadSegmentId = id;
            }
        }
        this.loader.load(segments, playlist.streamSwarmId);
        if (loadSegmentId) {
            const segment = await this.loader.getSegment(loadSegmentId);
            if (segment) {
                // Segment already loaded by loader
                this.onSegmentLoaded(segment);
            }
        }
    }
    getSegmentId(playlist, segmentSequence) {
        return `${playlist.streamSwarmId}+${segmentSequence}`;
    }
    getMasterSwarmId() {
        const settingsSwarmId = this.settings.swarmId && this.settings.swarmId.length !== 0 ? this.settings.swarmId : undefined;
        if (settingsSwarmId !== undefined) {
            return settingsSwarmId;
        }
        return this.masterPlaylist !== null ? this.masterPlaylist.requestUrl.split("?")[0] : undefined;
    }
    getStreamSwarmId(playlistUrl) {
        const masterSwarmId = this.getMasterSwarmId();
        if (this.masterPlaylist && this.masterPlaylist.manifest.playlists && masterSwarmId) {
            for (let i = 0; i < this.masterPlaylist.manifest.playlists.length; ++i) {
                const url = new URL(this.masterPlaylist.manifest.playlists[i].uri, this.masterPlaylist.responseUrl).toString();
                if (url === playlistUrl) {
                    return { streamSwarmId: `${masterSwarmId}+V${i}`, found: true, index: i };
                }
            }
        }
        return {
            streamSwarmId: masterSwarmId !== null && masterSwarmId !== void 0 ? masterSwarmId : playlistUrl.split("?")[0],
            found: false,
            index: -1,
        };
    }
    async loadContent(url, responseType, range) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = responseType;
            if (range) {
                xhr.setRequestHeader("Range", range);
            }
            xhr.addEventListener("readystatechange", () => {
                if (xhr.readyState !== 4)
                    return;
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                }
                else {
                    reject(xhr.statusText);
                }
            });
            const xhrSetup = this.loader.getSettings().xhrSetup;
            if (xhrSetup) {
                xhrSetup(xhr, url);
            }
            xhr.send();
        });
    }
}
exports.SegmentManager = SegmentManager;
class Playlist {
    constructor(requestUrl, responseUrl, manifest) {
        this.requestUrl = requestUrl;
        this.responseUrl = responseUrl;
        this.manifest = manifest;
        this.streamSwarmId = "";
    }
    getSegmentIndex(url, byteRange) {
        for (let i = 0; i < this.manifest.segments.length; ++i) {
            const segment = this.manifest.segments[i];
            const segmentUrl = this.getSegmentAbsoluteUrl(segment.uri);
            if (url === segmentUrl && compareByteRanges(segment.byterange, byteRange)) {
                return i;
            }
        }
        return -1;
    }
    getSegmentAbsoluteUrl(segmentUrl) {
        return new URL(segmentUrl, this.responseUrl).toString();
    }
}
class SegmentRequest {
    constructor(segmentUrl, segmentByteRange, segmentSequence, playlistRequestUrl, onSuccess, onError) {
        this.segmentUrl = segmentUrl;
        this.segmentByteRange = segmentByteRange;
        this.segmentSequence = segmentSequence;
        this.playlistRequestUrl = playlistRequestUrl;
        this.onSuccess = onSuccess;
        this.onError = onError;
    }
}
function compareByteRanges(b1, b2) {
    return b1 === undefined ? b2 === undefined : b2 !== undefined && b1.length === b2.length && b1.offset === b2.offset;
}
function byteRangeToString(byteRange) {
    if (byteRange === undefined) {
        return undefined;
    }
    const end = byteRange.offset + byteRange.length - 1;
    return `bytes=${byteRange.offset}-${end}`;
}

},{"@webtor/p2p-media-loader-core":"@webtor/p2p-media-loader-core","m3u8-parser":13}],5:[function(require,module,exports){
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

module.exports = _assertThisInitialized;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],6:[function(require,module,exports){
function _extends() {
  module.exports = _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  module.exports["default"] = module.exports, module.exports.__esModule = true;
  return _extends.apply(this, arguments);
}

module.exports = _extends;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],7:[function(require,module,exports){
var setPrototypeOf = require("./setPrototypeOf.js");

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  setPrototypeOf(subClass, superClass);
}

module.exports = _inheritsLoose;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{"./setPrototypeOf.js":9}],8:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],9:[function(require,module,exports){
function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  module.exports["default"] = module.exports, module.exports.__esModule = true;
  return _setPrototypeOf(o, p);
}

module.exports = _setPrototypeOf;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],10:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = decodeB64ToUint8Array;

var _window = _interopRequireDefault(require("global/window"));

var atob = function atob(s) {
  return _window.default.atob ? _window.default.atob(s) : Buffer.from(s, 'base64').toString('binary');
};

function decodeB64ToUint8Array(b64Text) {
  var decodedString = atob(b64Text);
  var array = new Uint8Array(decodedString.length);

  for (var i = 0; i < decodedString.length; i++) {
    array[i] = decodedString.charCodeAt(i);
  }

  return array;
}

module.exports = exports.default;
}).call(this)}).call(this,require("buffer").Buffer)
},{"@babel/runtime/helpers/interopRequireDefault":8,"buffer":"buffer","global/window":12}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * @file stream.js
 */

/**
 * A lightweight readable stream implemention that handles event dispatching.
 *
 * @class Stream
 */
var Stream = /*#__PURE__*/function () {
  function Stream() {
    this.listeners = {};
  }
  /**
   * Add a listener for a specified event type.
   *
   * @param {string} type the event name
   * @param {Function} listener the callback to be invoked when an event of
   * the specified type occurs
   */


  var _proto = Stream.prototype;

  _proto.on = function on(type, listener) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }

    this.listeners[type].push(listener);
  }
  /**
   * Remove a listener for a specified event type.
   *
   * @param {string} type the event name
   * @param {Function} listener  a function previously registered for this
   * type of event through `on`
   * @return {boolean} if we could turn it off or not
   */
  ;

  _proto.off = function off(type, listener) {
    if (!this.listeners[type]) {
      return false;
    }

    var index = this.listeners[type].indexOf(listener); // TODO: which is better?
    // In Video.js we slice listener functions
    // on trigger so that it does not mess up the order
    // while we loop through.
    //
    // Here we slice on off so that the loop in trigger
    // can continue using it's old reference to loop without
    // messing up the order.

    this.listeners[type] = this.listeners[type].slice(0);
    this.listeners[type].splice(index, 1);
    return index > -1;
  }
  /**
   * Trigger an event of the specified type on this stream. Any additional
   * arguments to this function are passed as parameters to event listeners.
   *
   * @param {string} type the event name
   */
  ;

  _proto.trigger = function trigger(type) {
    var callbacks = this.listeners[type];

    if (!callbacks) {
      return;
    } // Slicing the arguments on every invocation of this method
    // can add a significant amount of overhead. Avoid the
    // intermediate object creation for the common case of a
    // single callback argument


    if (arguments.length === 2) {
      var length = callbacks.length;

      for (var i = 0; i < length; ++i) {
        callbacks[i].call(this, arguments[1]);
      }
    } else {
      var args = Array.prototype.slice.call(arguments, 1);
      var _length = callbacks.length;

      for (var _i = 0; _i < _length; ++_i) {
        callbacks[_i].apply(this, args);
      }
    }
  }
  /**
   * Destroys the stream and cleans up.
   */
  ;

  _proto.dispose = function dispose() {
    this.listeners = {};
  }
  /**
   * Forwards all `data` events on this stream to the destination stream. The
   * destination stream should provide a method `push` to receive the data
   * events as they arrive.
   *
   * @param {Stream} destination the stream that will receive all `data` events
   * @see http://nodejs.org/api/stream.html#stream_readable_pipe_destination_options
   */
  ;

  _proto.pipe = function pipe(destination) {
    this.on('data', function (data) {
      destination.push(data);
    });
  };

  return Stream;
}();

exports.default = Stream;
module.exports = exports.default;
},{}],12:[function(require,module,exports){
(function (global){(function (){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
/*! @name m3u8-parser @version 4.6.0 @license Apache-2.0 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _inheritsLoose = require('@babel/runtime/helpers/inheritsLoose');
var Stream = require('@videojs/vhs-utils/cjs/stream.js');
var _extends = require('@babel/runtime/helpers/extends');
var _assertThisInitialized = require('@babel/runtime/helpers/assertThisInitialized');
var decodeB64ToUint8Array = require('@videojs/vhs-utils/cjs/decode-b64-to-uint8-array.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _inheritsLoose__default = /*#__PURE__*/_interopDefaultLegacy(_inheritsLoose);
var Stream__default = /*#__PURE__*/_interopDefaultLegacy(Stream);
var _extends__default = /*#__PURE__*/_interopDefaultLegacy(_extends);
var _assertThisInitialized__default = /*#__PURE__*/_interopDefaultLegacy(_assertThisInitialized);
var decodeB64ToUint8Array__default = /*#__PURE__*/_interopDefaultLegacy(decodeB64ToUint8Array);

/**
 * A stream that buffers string input and generates a `data` event for each
 * line.
 *
 * @class LineStream
 * @extends Stream
 */

var LineStream = /*#__PURE__*/function (_Stream) {
  _inheritsLoose__default['default'](LineStream, _Stream);

  function LineStream() {
    var _this;

    _this = _Stream.call(this) || this;
    _this.buffer = '';
    return _this;
  }
  /**
   * Add new data to be parsed.
   *
   * @param {string} data the text to process
   */


  var _proto = LineStream.prototype;

  _proto.push = function push(data) {
    var nextNewline;
    this.buffer += data;
    nextNewline = this.buffer.indexOf('\n');

    for (; nextNewline > -1; nextNewline = this.buffer.indexOf('\n')) {
      this.trigger('data', this.buffer.substring(0, nextNewline));
      this.buffer = this.buffer.substring(nextNewline + 1);
    }
  };

  return LineStream;
}(Stream__default['default']);

var TAB = String.fromCharCode(0x09);

var parseByterange = function parseByterange(byterangeString) {
  // optionally match and capture 0+ digits before `@`
  // optionally match and capture 0+ digits after `@`
  var match = /([0-9.]*)?@?([0-9.]*)?/.exec(byterangeString || '');
  var result = {};

  if (match[1]) {
    result.length = parseInt(match[1], 10);
  }

  if (match[2]) {
    result.offset = parseInt(match[2], 10);
  }

  return result;
};
/**
 * "forgiving" attribute list psuedo-grammar:
 * attributes -> keyvalue (',' keyvalue)*
 * keyvalue   -> key '=' value
 * key        -> [^=]*
 * value      -> '"' [^"]* '"' | [^,]*
 */


var attributeSeparator = function attributeSeparator() {
  var key = '[^=]*';
  var value = '"[^"]*"|[^,]*';
  var keyvalue = '(?:' + key + ')=(?:' + value + ')';
  return new RegExp('(?:^|,)(' + keyvalue + ')');
};
/**
 * Parse attributes from a line given the separator
 *
 * @param {string} attributes the attribute line to parse
 */


var parseAttributes = function parseAttributes(attributes) {
  // split the string using attributes as the separator
  var attrs = attributes.split(attributeSeparator());
  var result = {};
  var i = attrs.length;
  var attr;

  while (i--) {
    // filter out unmatched portions of the string
    if (attrs[i] === '') {
      continue;
    } // split the key and value


    attr = /([^=]*)=(.*)/.exec(attrs[i]).slice(1); // trim whitespace and remove optional quotes around the value

    attr[0] = attr[0].replace(/^\s+|\s+$/g, '');
    attr[1] = attr[1].replace(/^\s+|\s+$/g, '');
    attr[1] = attr[1].replace(/^['"](.*)['"]$/g, '$1');
    result[attr[0]] = attr[1];
  }

  return result;
};
/**
 * A line-level M3U8 parser event stream. It expects to receive input one
 * line at a time and performs a context-free parse of its contents. A stream
 * interpretation of a manifest can be useful if the manifest is expected to
 * be too large to fit comfortably into memory or the entirety of the input
 * is not immediately available. Otherwise, it's probably much easier to work
 * with a regular `Parser` object.
 *
 * Produces `data` events with an object that captures the parser's
 * interpretation of the input. That object has a property `tag` that is one
 * of `uri`, `comment`, or `tag`. URIs only have a single additional
 * property, `line`, which captures the entirety of the input without
 * interpretation. Comments similarly have a single additional property
 * `text` which is the input without the leading `#`.
 *
 * Tags always have a property `tagType` which is the lower-cased version of
 * the M3U8 directive without the `#EXT` or `#EXT-X-` prefix. For instance,
 * `#EXT-X-MEDIA-SEQUENCE` becomes `media-sequence` when parsed. Unrecognized
 * tags are given the tag type `unknown` and a single additional property
 * `data` with the remainder of the input.
 *
 * @class ParseStream
 * @extends Stream
 */


var ParseStream = /*#__PURE__*/function (_Stream) {
  _inheritsLoose__default['default'](ParseStream, _Stream);

  function ParseStream() {
    var _this;

    _this = _Stream.call(this) || this;
    _this.customParsers = [];
    _this.tagMappers = [];
    return _this;
  }
  /**
   * Parses an additional line of input.
   *
   * @param {string} line a single line of an M3U8 file to parse
   */


  var _proto = ParseStream.prototype;

  _proto.push = function push(line) {
    var _this2 = this;

    var match;
    var event; // strip whitespace

    line = line.trim();

    if (line.length === 0) {
      // ignore empty lines
      return;
    } // URIs


    if (line[0] !== '#') {
      this.trigger('data', {
        type: 'uri',
        uri: line
      });
      return;
    } // map tags


    var newLines = this.tagMappers.reduce(function (acc, mapper) {
      var mappedLine = mapper(line); // skip if unchanged

      if (mappedLine === line) {
        return acc;
      }

      return acc.concat([mappedLine]);
    }, [line]);
    newLines.forEach(function (newLine) {
      for (var i = 0; i < _this2.customParsers.length; i++) {
        if (_this2.customParsers[i].call(_this2, newLine)) {
          return;
        }
      } // Comments


      if (newLine.indexOf('#EXT') !== 0) {
        _this2.trigger('data', {
          type: 'comment',
          text: newLine.slice(1)
        });

        return;
      } // strip off any carriage returns here so the regex matching
      // doesn't have to account for them.


      newLine = newLine.replace('\r', ''); // Tags

      match = /^#EXTM3U/.exec(newLine);

      if (match) {
        _this2.trigger('data', {
          type: 'tag',
          tagType: 'm3u'
        });

        return;
      }

      match = /^#EXTINF:?([0-9\.]*)?,?(.*)?$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'inf'
        };

        if (match[1]) {
          event.duration = parseFloat(match[1]);
        }

        if (match[2]) {
          event.title = match[2];
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-TARGETDURATION:?([0-9.]*)?/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'targetduration'
        };

        if (match[1]) {
          event.duration = parseInt(match[1], 10);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-VERSION:?([0-9.]*)?/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'version'
        };

        if (match[1]) {
          event.version = parseInt(match[1], 10);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-MEDIA-SEQUENCE:?(\-?[0-9.]*)?/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'media-sequence'
        };

        if (match[1]) {
          event.number = parseInt(match[1], 10);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-DISCONTINUITY-SEQUENCE:?(\-?[0-9.]*)?/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'discontinuity-sequence'
        };

        if (match[1]) {
          event.number = parseInt(match[1], 10);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-PLAYLIST-TYPE:?(.*)?$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'playlist-type'
        };

        if (match[1]) {
          event.playlistType = match[1];
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-BYTERANGE:?(.*)?$/.exec(newLine);

      if (match) {
        event = _extends__default['default'](parseByterange(match[1]), {
          type: 'tag',
          tagType: 'byterange'
        });

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-ALLOW-CACHE:?(YES|NO)?/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'allow-cache'
        };

        if (match[1]) {
          event.allowed = !/NO/.test(match[1]);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-MAP:?(.*)$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'map'
        };

        if (match[1]) {
          var attributes = parseAttributes(match[1]);

          if (attributes.URI) {
            event.uri = attributes.URI;
          }

          if (attributes.BYTERANGE) {
            event.byterange = parseByterange(attributes.BYTERANGE);
          }
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-STREAM-INF:?(.*)$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'stream-inf'
        };

        if (match[1]) {
          event.attributes = parseAttributes(match[1]);

          if (event.attributes.RESOLUTION) {
            var split = event.attributes.RESOLUTION.split('x');
            var resolution = {};

            if (split[0]) {
              resolution.width = parseInt(split[0], 10);
            }

            if (split[1]) {
              resolution.height = parseInt(split[1], 10);
            }

            event.attributes.RESOLUTION = resolution;
          }

          if (event.attributes.BANDWIDTH) {
            event.attributes.BANDWIDTH = parseInt(event.attributes.BANDWIDTH, 10);
          }

          if (event.attributes['PROGRAM-ID']) {
            event.attributes['PROGRAM-ID'] = parseInt(event.attributes['PROGRAM-ID'], 10);
          }
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-MEDIA:?(.*)$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'media'
        };

        if (match[1]) {
          event.attributes = parseAttributes(match[1]);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-ENDLIST/.exec(newLine);

      if (match) {
        _this2.trigger('data', {
          type: 'tag',
          tagType: 'endlist'
        });

        return;
      }

      match = /^#EXT-X-DISCONTINUITY/.exec(newLine);

      if (match) {
        _this2.trigger('data', {
          type: 'tag',
          tagType: 'discontinuity'
        });

        return;
      }

      match = /^#EXT-X-PROGRAM-DATE-TIME:?(.*)$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'program-date-time'
        };

        if (match[1]) {
          event.dateTimeString = match[1];
          event.dateTimeObject = new Date(match[1]);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-KEY:?(.*)$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'key'
        };

        if (match[1]) {
          event.attributes = parseAttributes(match[1]); // parse the IV string into a Uint32Array

          if (event.attributes.IV) {
            if (event.attributes.IV.substring(0, 2).toLowerCase() === '0x') {
              event.attributes.IV = event.attributes.IV.substring(2);
            }

            event.attributes.IV = event.attributes.IV.match(/.{8}/g);
            event.attributes.IV[0] = parseInt(event.attributes.IV[0], 16);
            event.attributes.IV[1] = parseInt(event.attributes.IV[1], 16);
            event.attributes.IV[2] = parseInt(event.attributes.IV[2], 16);
            event.attributes.IV[3] = parseInt(event.attributes.IV[3], 16);
            event.attributes.IV = new Uint32Array(event.attributes.IV);
          }
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-START:?(.*)$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'start'
        };

        if (match[1]) {
          event.attributes = parseAttributes(match[1]);
          event.attributes['TIME-OFFSET'] = parseFloat(event.attributes['TIME-OFFSET']);
          event.attributes.PRECISE = /YES/.test(event.attributes.PRECISE);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-CUE-OUT-CONT:?(.*)?$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'cue-out-cont'
        };

        if (match[1]) {
          event.data = match[1];
        } else {
          event.data = '';
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-CUE-OUT:?(.*)?$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'cue-out'
        };

        if (match[1]) {
          event.data = match[1];
        } else {
          event.data = '';
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-CUE-IN:?(.*)?$/.exec(newLine);

      if (match) {
        event = {
          type: 'tag',
          tagType: 'cue-in'
        };

        if (match[1]) {
          event.data = match[1];
        } else {
          event.data = '';
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-SKIP:(.*)$/.exec(newLine);

      if (match && match[1]) {
        event = {
          type: 'tag',
          tagType: 'skip'
        };
        event.attributes = parseAttributes(match[1]);

        if (event.attributes.hasOwnProperty('SKIPPED-SEGMENTS')) {
          event.attributes['SKIPPED-SEGMENTS'] = parseInt(event.attributes['SKIPPED-SEGMENTS'], 10);
        }

        if (event.attributes.hasOwnProperty('RECENTLY-REMOVED-DATERANGES')) {
          event.attributes['RECENTLY-REMOVED-DATERANGES'] = event.attributes['RECENTLY-REMOVED-DATERANGES'].split(TAB);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-PART:(.*)$/.exec(newLine);

      if (match && match[1]) {
        event = {
          type: 'tag',
          tagType: 'part'
        };
        event.attributes = parseAttributes(match[1]);
        ['DURATION'].forEach(function (key) {
          if (event.attributes.hasOwnProperty(key)) {
            event.attributes[key] = parseFloat(event.attributes[key]);
          }
        });
        ['INDEPENDENT', 'GAP'].forEach(function (key) {
          if (event.attributes.hasOwnProperty(key)) {
            event.attributes[key] = /YES/.test(event.attributes[key]);
          }
        });

        if (event.attributes.hasOwnProperty('BYTERANGE')) {
          event.attributes.byterange = parseByterange(event.attributes.BYTERANGE);
        }

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-SERVER-CONTROL:(.*)$/.exec(newLine);

      if (match && match[1]) {
        event = {
          type: 'tag',
          tagType: 'server-control'
        };
        event.attributes = parseAttributes(match[1]);
        ['CAN-SKIP-UNTIL', 'PART-HOLD-BACK', 'HOLD-BACK'].forEach(function (key) {
          if (event.attributes.hasOwnProperty(key)) {
            event.attributes[key] = parseFloat(event.attributes[key]);
          }
        });
        ['CAN-SKIP-DATERANGES', 'CAN-BLOCK-RELOAD'].forEach(function (key) {
          if (event.attributes.hasOwnProperty(key)) {
            event.attributes[key] = /YES/.test(event.attributes[key]);
          }
        });

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-PART-INF:(.*)$/.exec(newLine);

      if (match && match[1]) {
        event = {
          type: 'tag',
          tagType: 'part-inf'
        };
        event.attributes = parseAttributes(match[1]);
        ['PART-TARGET'].forEach(function (key) {
          if (event.attributes.hasOwnProperty(key)) {
            event.attributes[key] = parseFloat(event.attributes[key]);
          }
        });

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-PRELOAD-HINT:(.*)$/.exec(newLine);

      if (match && match[1]) {
        event = {
          type: 'tag',
          tagType: 'preload-hint'
        };
        event.attributes = parseAttributes(match[1]);
        ['BYTERANGE-START', 'BYTERANGE-LENGTH'].forEach(function (key) {
          if (event.attributes.hasOwnProperty(key)) {
            event.attributes[key] = parseInt(event.attributes[key], 10);
            var subkey = key === 'BYTERANGE-LENGTH' ? 'length' : 'offset';
            event.attributes.byterange = event.attributes.byterange || {};
            event.attributes.byterange[subkey] = event.attributes[key]; // only keep the parsed byterange object.

            delete event.attributes[key];
          }
        });

        _this2.trigger('data', event);

        return;
      }

      match = /^#EXT-X-RENDITION-REPORT:(.*)$/.exec(newLine);

      if (match && match[1]) {
        event = {
          type: 'tag',
          tagType: 'rendition-report'
        };
        event.attributes = parseAttributes(match[1]);
        ['LAST-MSN', 'LAST-PART'].forEach(function (key) {
          if (event.attributes.hasOwnProperty(key)) {
            event.attributes[key] = parseInt(event.attributes[key], 10);
          }
        });

        _this2.trigger('data', event);

        return;
      } // unknown tag type


      _this2.trigger('data', {
        type: 'tag',
        data: newLine.slice(4)
      });
    });
  }
  /**
   * Add a parser for custom headers
   *
   * @param {Object}   options              a map of options for the added parser
   * @param {RegExp}   options.expression   a regular expression to match the custom header
   * @param {string}   options.customType   the custom type to register to the output
   * @param {Function} [options.dataParser] function to parse the line into an object
   * @param {boolean}  [options.segment]    should tag data be attached to the segment object
   */
  ;

  _proto.addParser = function addParser(_ref) {
    var _this3 = this;

    var expression = _ref.expression,
        customType = _ref.customType,
        dataParser = _ref.dataParser,
        segment = _ref.segment;

    if (typeof dataParser !== 'function') {
      dataParser = function dataParser(line) {
        return line;
      };
    }

    this.customParsers.push(function (line) {
      var match = expression.exec(line);

      if (match) {
        _this3.trigger('data', {
          type: 'custom',
          data: dataParser(line),
          customType: customType,
          segment: segment
        });

        return true;
      }
    });
  }
  /**
   * Add a custom header mapper
   *
   * @param {Object}   options
   * @param {RegExp}   options.expression   a regular expression to match the custom header
   * @param {Function} options.map          function to translate tag into a different tag
   */
  ;

  _proto.addTagMapper = function addTagMapper(_ref2) {
    var expression = _ref2.expression,
        map = _ref2.map;

    var mapFn = function mapFn(line) {
      if (expression.test(line)) {
        return map(line);
      }

      return line;
    };

    this.tagMappers.push(mapFn);
  };

  return ParseStream;
}(Stream__default['default']);

var camelCase = function camelCase(str) {
  return str.toLowerCase().replace(/-(\w)/g, function (a) {
    return a[1].toUpperCase();
  });
};

var camelCaseKeys = function camelCaseKeys(attributes) {
  var result = {};
  Object.keys(attributes).forEach(function (key) {
    result[camelCase(key)] = attributes[key];
  });
  return result;
}; // set SERVER-CONTROL hold back based upon targetDuration and partTargetDuration
// we need this helper because defaults are based upon targetDuration and
// partTargetDuration being set, but they may not be if SERVER-CONTROL appears before
// target durations are set.


var setHoldBack = function setHoldBack(manifest) {
  var serverControl = manifest.serverControl,
      targetDuration = manifest.targetDuration,
      partTargetDuration = manifest.partTargetDuration;

  if (!serverControl) {
    return;
  }

  var tag = '#EXT-X-SERVER-CONTROL';
  var hb = 'holdBack';
  var phb = 'partHoldBack';
  var minTargetDuration = targetDuration && targetDuration * 3;
  var minPartDuration = partTargetDuration && partTargetDuration * 2;

  if (targetDuration && !serverControl.hasOwnProperty(hb)) {
    serverControl[hb] = minTargetDuration;
    this.trigger('info', {
      message: tag + " defaulting HOLD-BACK to targetDuration * 3 (" + minTargetDuration + ")."
    });
  }

  if (minTargetDuration && serverControl[hb] < minTargetDuration) {
    this.trigger('warn', {
      message: tag + " clamping HOLD-BACK (" + serverControl[hb] + ") to targetDuration * 3 (" + minTargetDuration + ")"
    });
    serverControl[hb] = minTargetDuration;
  } // default no part hold back to part target duration * 3


  if (partTargetDuration && !serverControl.hasOwnProperty(phb)) {
    serverControl[phb] = partTargetDuration * 3;
    this.trigger('info', {
      message: tag + " defaulting PART-HOLD-BACK to partTargetDuration * 3 (" + serverControl[phb] + ")."
    });
  } // if part hold back is too small default it to part target duration * 2


  if (partTargetDuration && serverControl[phb] < minPartDuration) {
    this.trigger('warn', {
      message: tag + " clamping PART-HOLD-BACK (" + serverControl[phb] + ") to partTargetDuration * 2 (" + minPartDuration + ")."
    });
    serverControl[phb] = minPartDuration;
  }
};
/**
 * A parser for M3U8 files. The current interpretation of the input is
 * exposed as a property `manifest` on parser objects. It's just two lines to
 * create and parse a manifest once you have the contents available as a string:
 *
 * ```js
 * var parser = new m3u8.Parser();
 * parser.push(xhr.responseText);
 * ```
 *
 * New input can later be applied to update the manifest object by calling
 * `push` again.
 *
 * The parser attempts to create a usable manifest object even if the
 * underlying input is somewhat nonsensical. It emits `info` and `warning`
 * events during the parse if it encounters input that seems invalid or
 * requires some property of the manifest object to be defaulted.
 *
 * @class Parser
 * @extends Stream
 */


var Parser = /*#__PURE__*/function (_Stream) {
  _inheritsLoose__default['default'](Parser, _Stream);

  function Parser() {
    var _this;

    _this = _Stream.call(this) || this;
    _this.lineStream = new LineStream();
    _this.parseStream = new ParseStream();

    _this.lineStream.pipe(_this.parseStream);
    /* eslint-disable consistent-this */


    var self = _assertThisInitialized__default['default'](_this);
    /* eslint-enable consistent-this */


    var uris = [];
    var currentUri = {}; // if specified, the active EXT-X-MAP definition

    var currentMap; // if specified, the active decryption key

    var _key;

    var hasParts = false;

    var noop = function noop() {};

    var defaultMediaGroups = {
      'AUDIO': {},
      'VIDEO': {},
      'CLOSED-CAPTIONS': {},
      'SUBTITLES': {}
    }; // This is the Widevine UUID from DASH IF IOP. The same exact string is
    // used in MPDs with Widevine encrypted streams.

    var widevineUuid = 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed'; // group segments into numbered timelines delineated by discontinuities

    var currentTimeline = 0; // the manifest is empty until the parse stream begins delivering data

    _this.manifest = {
      allowCache: true,
      discontinuityStarts: [],
      segments: []
    }; // keep track of the last seen segment's byte range end, as segments are not required
    // to provide the offset, in which case it defaults to the next byte after the
    // previous segment

    var lastByterangeEnd = 0; // keep track of the last seen part's byte range end.

    var lastPartByterangeEnd = 0;

    _this.on('end', function () {
      // only add preloadSegment if we don't yet have a uri for it.
      // and we actually have parts/preloadHints
      if (currentUri.uri || !currentUri.parts && !currentUri.preloadHints) {
        return;
      }

      if (!currentUri.map && currentMap) {
        currentUri.map = currentMap;
      }

      if (!currentUri.key && _key) {
        currentUri.key = _key;
      }

      if (!currentUri.timeline && typeof currentTimeline === 'number') {
        currentUri.timeline = currentTimeline;
      }

      _this.manifest.preloadSegment = currentUri;
    }); // update the manifest with the m3u8 entry from the parse stream


    _this.parseStream.on('data', function (entry) {
      var mediaGroup;
      var rendition;
      ({
        tag: function tag() {
          // switch based on the tag type
          (({
            version: function version() {
              if (entry.version) {
                this.manifest.version = entry.version;
              }
            },
            'allow-cache': function allowCache() {
              this.manifest.allowCache = entry.allowed;

              if (!('allowed' in entry)) {
                this.trigger('info', {
                  message: 'defaulting allowCache to YES'
                });
                this.manifest.allowCache = true;
              }
            },
            byterange: function byterange() {
              var byterange = {};

              if ('length' in entry) {
                currentUri.byterange = byterange;
                byterange.length = entry.length;

                if (!('offset' in entry)) {
                  /*
                   * From the latest spec (as of this writing):
                   * https://tools.ietf.org/html/draft-pantos-http-live-streaming-23#section-4.3.2.2
                   *
                   * Same text since EXT-X-BYTERANGE's introduction in draft 7:
                   * https://tools.ietf.org/html/draft-pantos-http-live-streaming-07#section-3.3.1)
                   *
                   * "If o [offset] is not present, the sub-range begins at the next byte
                   * following the sub-range of the previous media segment."
                   */
                  entry.offset = lastByterangeEnd;
                }
              }

              if ('offset' in entry) {
                currentUri.byterange = byterange;
                byterange.offset = entry.offset;
              }

              lastByterangeEnd = byterange.offset + byterange.length;
            },
            endlist: function endlist() {
              this.manifest.endList = true;
            },
            inf: function inf() {
              if (!('mediaSequence' in this.manifest)) {
                this.manifest.mediaSequence = 0;
                this.trigger('info', {
                  message: 'defaulting media sequence to zero'
                });
              }

              if (!('discontinuitySequence' in this.manifest)) {
                this.manifest.discontinuitySequence = 0;
                this.trigger('info', {
                  message: 'defaulting discontinuity sequence to zero'
                });
              }

              if (entry.duration > 0) {
                currentUri.duration = entry.duration;
              }

              if (entry.duration === 0) {
                currentUri.duration = 0.01;
                this.trigger('info', {
                  message: 'updating zero segment duration to a small value'
                });
              }

              this.manifest.segments = uris;
            },
            key: function key() {
              if (!entry.attributes) {
                this.trigger('warn', {
                  message: 'ignoring key declaration without attribute list'
                });
                return;
              } // clear the active encryption key


              if (entry.attributes.METHOD === 'NONE') {
                _key = null;
                return;
              }

              if (!entry.attributes.URI) {
                this.trigger('warn', {
                  message: 'ignoring key declaration without URI'
                });
                return;
              } // check if the content is encrypted for Widevine
              // Widevine/HLS spec: https://storage.googleapis.com/wvdocs/Widevine_DRM_HLS.pdf


              if (entry.attributes.KEYFORMAT === widevineUuid) {
                var VALID_METHODS = ['SAMPLE-AES', 'SAMPLE-AES-CTR', 'SAMPLE-AES-CENC'];

                if (VALID_METHODS.indexOf(entry.attributes.METHOD) === -1) {
                  this.trigger('warn', {
                    message: 'invalid key method provided for Widevine'
                  });
                  return;
                }

                if (entry.attributes.METHOD === 'SAMPLE-AES-CENC') {
                  this.trigger('warn', {
                    message: 'SAMPLE-AES-CENC is deprecated, please use SAMPLE-AES-CTR instead'
                  });
                }

                if (entry.attributes.URI.substring(0, 23) !== 'data:text/plain;base64,') {
                  this.trigger('warn', {
                    message: 'invalid key URI provided for Widevine'
                  });
                  return;
                }

                if (!(entry.attributes.KEYID && entry.attributes.KEYID.substring(0, 2) === '0x')) {
                  this.trigger('warn', {
                    message: 'invalid key ID provided for Widevine'
                  });
                  return;
                } // if Widevine key attributes are valid, store them as `contentProtection`
                // on the manifest to emulate Widevine tag structure in a DASH mpd


                this.manifest.contentProtection = {
                  'com.widevine.alpha': {
                    attributes: {
                      schemeIdUri: entry.attributes.KEYFORMAT,
                      // remove '0x' from the key id string
                      keyId: entry.attributes.KEYID.substring(2)
                    },
                    // decode the base64-encoded PSSH box
                    pssh: decodeB64ToUint8Array__default['default'](entry.attributes.URI.split(',')[1])
                  }
                };
                return;
              }

              if (!entry.attributes.METHOD) {
                this.trigger('warn', {
                  message: 'defaulting key method to AES-128'
                });
              } // setup an encryption key for upcoming segments


              _key = {
                method: entry.attributes.METHOD || 'AES-128',
                uri: entry.attributes.URI
              };

              if (typeof entry.attributes.IV !== 'undefined') {
                _key.iv = entry.attributes.IV;
              }
            },
            'media-sequence': function mediaSequence() {
              if (!isFinite(entry.number)) {
                this.trigger('warn', {
                  message: 'ignoring invalid media sequence: ' + entry.number
                });
                return;
              }

              this.manifest.mediaSequence = entry.number;
            },
            'discontinuity-sequence': function discontinuitySequence() {
              if (!isFinite(entry.number)) {
                this.trigger('warn', {
                  message: 'ignoring invalid discontinuity sequence: ' + entry.number
                });
                return;
              }

              this.manifest.discontinuitySequence = entry.number;
              currentTimeline = entry.number;
            },
            'playlist-type': function playlistType() {
              if (!/VOD|EVENT/.test(entry.playlistType)) {
                this.trigger('warn', {
                  message: 'ignoring unknown playlist type: ' + entry.playlist
                });
                return;
              }

              this.manifest.playlistType = entry.playlistType;
            },
            map: function map() {
              currentMap = {};

              if (entry.uri) {
                currentMap.uri = entry.uri;
              }

              if (entry.byterange) {
                currentMap.byterange = entry.byterange;
              }
            },
            'stream-inf': function streamInf() {
              this.manifest.playlists = uris;
              this.manifest.mediaGroups = this.manifest.mediaGroups || defaultMediaGroups;

              if (!entry.attributes) {
                this.trigger('warn', {
                  message: 'ignoring empty stream-inf attributes'
                });
                return;
              }

              if (!currentUri.attributes) {
                currentUri.attributes = {};
              }

              _extends__default['default'](currentUri.attributes, entry.attributes);
            },
            media: function media() {
              this.manifest.mediaGroups = this.manifest.mediaGroups || defaultMediaGroups;

              if (!(entry.attributes && entry.attributes.TYPE && entry.attributes['GROUP-ID'] && entry.attributes.NAME)) {
                this.trigger('warn', {
                  message: 'ignoring incomplete or missing media group'
                });
                return;
              } // find the media group, creating defaults as necessary


              var mediaGroupType = this.manifest.mediaGroups[entry.attributes.TYPE];
              mediaGroupType[entry.attributes['GROUP-ID']] = mediaGroupType[entry.attributes['GROUP-ID']] || {};
              mediaGroup = mediaGroupType[entry.attributes['GROUP-ID']]; // collect the rendition metadata

              rendition = {
                default: /yes/i.test(entry.attributes.DEFAULT)
              };

              if (rendition.default) {
                rendition.autoselect = true;
              } else {
                rendition.autoselect = /yes/i.test(entry.attributes.AUTOSELECT);
              }

              if (entry.attributes.LANGUAGE) {
                rendition.language = entry.attributes.LANGUAGE;
              }

              if (entry.attributes.URI) {
                rendition.uri = entry.attributes.URI;
              }

              if (entry.attributes['INSTREAM-ID']) {
                rendition.instreamId = entry.attributes['INSTREAM-ID'];
              }

              if (entry.attributes.CHARACTERISTICS) {
                rendition.characteristics = entry.attributes.CHARACTERISTICS;
              }

              if (entry.attributes.FORCED) {
                rendition.forced = /yes/i.test(entry.attributes.FORCED);
              } // insert the new rendition


              mediaGroup[entry.attributes.NAME] = rendition;
            },
            discontinuity: function discontinuity() {
              currentTimeline += 1;
              currentUri.discontinuity = true;
              this.manifest.discontinuityStarts.push(uris.length);
            },
            'program-date-time': function programDateTime() {
              if (typeof this.manifest.dateTimeString === 'undefined') {
                // PROGRAM-DATE-TIME is a media-segment tag, but for backwards
                // compatibility, we add the first occurence of the PROGRAM-DATE-TIME tag
                // to the manifest object
                // TODO: Consider removing this in future major version
                this.manifest.dateTimeString = entry.dateTimeString;
                this.manifest.dateTimeObject = entry.dateTimeObject;
              }

              currentUri.dateTimeString = entry.dateTimeString;
              currentUri.dateTimeObject = entry.dateTimeObject;
            },
            targetduration: function targetduration() {
              if (!isFinite(entry.duration) || entry.duration < 0) {
                this.trigger('warn', {
                  message: 'ignoring invalid target duration: ' + entry.duration
                });
                return;
              }

              this.manifest.targetDuration = entry.duration;
              setHoldBack.call(this, this.manifest);
            },
            start: function start() {
              if (!entry.attributes || isNaN(entry.attributes['TIME-OFFSET'])) {
                this.trigger('warn', {
                  message: 'ignoring start declaration without appropriate attribute list'
                });
                return;
              }

              this.manifest.start = {
                timeOffset: entry.attributes['TIME-OFFSET'],
                precise: entry.attributes.PRECISE
              };
            },
            'cue-out': function cueOut() {
              currentUri.cueOut = entry.data;
            },
            'cue-out-cont': function cueOutCont() {
              currentUri.cueOutCont = entry.data;
            },
            'cue-in': function cueIn() {
              currentUri.cueIn = entry.data;
            },
            'skip': function skip() {
              this.manifest.skip = camelCaseKeys(entry.attributes);
              this.warnOnMissingAttributes_('#EXT-X-SKIP', entry.attributes, ['SKIPPED-SEGMENTS']);
            },
            'part': function part() {
              var _this2 = this;

              hasParts = true; // parts are always specifed before a segment

              var segmentIndex = this.manifest.segments.length;
              var part = camelCaseKeys(entry.attributes);
              currentUri.parts = currentUri.parts || [];
              currentUri.parts.push(part);

              if (part.byterange) {
                if (!part.byterange.hasOwnProperty('offset')) {
                  part.byterange.offset = lastPartByterangeEnd;
                }

                lastPartByterangeEnd = part.byterange.offset + part.byterange.length;
              }

              var partIndex = currentUri.parts.length - 1;
              this.warnOnMissingAttributes_("#EXT-X-PART #" + partIndex + " for segment #" + segmentIndex, entry.attributes, ['URI', 'DURATION']);

              if (this.manifest.renditionReports) {
                this.manifest.renditionReports.forEach(function (r, i) {
                  if (!r.hasOwnProperty('lastPart')) {
                    _this2.trigger('warn', {
                      message: "#EXT-X-RENDITION-REPORT #" + i + " lacks required attribute(s): LAST-PART"
                    });
                  }
                });
              }
            },
            'server-control': function serverControl() {
              var attrs = this.manifest.serverControl = camelCaseKeys(entry.attributes);

              if (!attrs.hasOwnProperty('canBlockReload')) {
                attrs.canBlockReload = false;
                this.trigger('info', {
                  message: '#EXT-X-SERVER-CONTROL defaulting CAN-BLOCK-RELOAD to false'
                });
              }

              setHoldBack.call(this, this.manifest);

              if (attrs.canSkipDateranges && !attrs.hasOwnProperty('canSkipUntil')) {
                this.trigger('warn', {
                  message: '#EXT-X-SERVER-CONTROL lacks required attribute CAN-SKIP-UNTIL which is required when CAN-SKIP-DATERANGES is set'
                });
              }
            },
            'preload-hint': function preloadHint() {
              // parts are always specifed before a segment
              var segmentIndex = this.manifest.segments.length;
              var hint = camelCaseKeys(entry.attributes);
              var isPart = hint.type && hint.type === 'PART';
              currentUri.preloadHints = currentUri.preloadHints || [];
              currentUri.preloadHints.push(hint);

              if (hint.byterange) {
                if (!hint.byterange.hasOwnProperty('offset')) {
                  // use last part byterange end or zero if not a part.
                  hint.byterange.offset = isPart ? lastPartByterangeEnd : 0;

                  if (isPart) {
                    lastPartByterangeEnd = hint.byterange.offset + hint.byterange.length;
                  }
                }
              }

              var index = currentUri.preloadHints.length - 1;
              this.warnOnMissingAttributes_("#EXT-X-PRELOAD-HINT #" + index + " for segment #" + segmentIndex, entry.attributes, ['TYPE', 'URI']);

              if (!hint.type) {
                return;
              } // search through all preload hints except for the current one for
              // a duplicate type.


              for (var i = 0; i < currentUri.preloadHints.length - 1; i++) {
                var otherHint = currentUri.preloadHints[i];

                if (!otherHint.type) {
                  continue;
                }

                if (otherHint.type === hint.type) {
                  this.trigger('warn', {
                    message: "#EXT-X-PRELOAD-HINT #" + index + " for segment #" + segmentIndex + " has the same TYPE " + hint.type + " as preload hint #" + i
                  });
                }
              }
            },
            'rendition-report': function renditionReport() {
              var report = camelCaseKeys(entry.attributes);
              this.manifest.renditionReports = this.manifest.renditionReports || [];
              this.manifest.renditionReports.push(report);
              var index = this.manifest.renditionReports.length - 1;
              var required = ['LAST-MSN', 'URI'];

              if (hasParts) {
                required.push('LAST-PART');
              }

              this.warnOnMissingAttributes_("#EXT-X-RENDITION-REPORT #" + index, entry.attributes, required);
            },
            'part-inf': function partInf() {
              this.manifest.partInf = camelCaseKeys(entry.attributes);
              this.warnOnMissingAttributes_('#EXT-X-PART-INF', entry.attributes, ['PART-TARGET']);

              if (this.manifest.partInf.partTarget) {
                this.manifest.partTargetDuration = this.manifest.partInf.partTarget;
              }

              setHoldBack.call(this, this.manifest);
            }
          })[entry.tagType] || noop).call(self);
        },
        uri: function uri() {
          currentUri.uri = entry.uri;
          uris.push(currentUri); // if no explicit duration was declared, use the target duration

          if (this.manifest.targetDuration && !('duration' in currentUri)) {
            this.trigger('warn', {
              message: 'defaulting segment duration to the target duration'
            });
            currentUri.duration = this.manifest.targetDuration;
          } // annotate with encryption information, if necessary


          if (_key) {
            currentUri.key = _key;
          }

          currentUri.timeline = currentTimeline; // annotate with initialization segment information, if necessary

          if (currentMap) {
            currentUri.map = currentMap;
          } // reset the last byterange end as it needs to be 0 between parts


          lastPartByterangeEnd = 0; // prepare for the next URI

          currentUri = {};
        },
        comment: function comment() {// comments are not important for playback
        },
        custom: function custom() {
          // if this is segment-level data attach the output to the segment
          if (entry.segment) {
            currentUri.custom = currentUri.custom || {};
            currentUri.custom[entry.customType] = entry.data; // if this is manifest-level data attach to the top level manifest object
          } else {
            this.manifest.custom = this.manifest.custom || {};
            this.manifest.custom[entry.customType] = entry.data;
          }
        }
      })[entry.type].call(self);
    });

    return _this;
  }

  var _proto = Parser.prototype;

  _proto.warnOnMissingAttributes_ = function warnOnMissingAttributes_(identifier, attributes, required) {
    var missing = [];
    required.forEach(function (key) {
      if (!attributes.hasOwnProperty(key)) {
        missing.push(key);
      }
    });

    if (missing.length) {
      this.trigger('warn', {
        message: identifier + " lacks required attribute(s): " + missing.join(', ')
      });
    }
  }
  /**
   * Parse the input string and update the manifest object.
   *
   * @param {string} chunk a potentially incomplete portion of the manifest
   */
  ;

  _proto.push = function push(chunk) {
    this.lineStream.push(chunk);
  }
  /**
   * Flush any remaining input. This can be handy if the last line of an M3U8
   * manifest did not contain a trailing newline but the file has been
   * completely received.
   */
  ;

  _proto.end = function end() {
    // flush any buffered input
    this.lineStream.push('\n');
    this.trigger('end');
  }
  /**
   * Add an additional parser for non-standard tags
   *
   * @param {Object}   options              a map of options for the added parser
   * @param {RegExp}   options.expression   a regular expression to match the custom header
   * @param {string}   options.type         the type to register to the output
   * @param {Function} [options.dataParser] function to parse the line into an object
   * @param {boolean}  [options.segment]    should tag data be attached to the segment object
   */
  ;

  _proto.addParser = function addParser(options) {
    this.parseStream.addParser(options);
  }
  /**
   * Add a custom header mapper
   *
   * @param {Object}   options
   * @param {RegExp}   options.expression   a regular expression to match the custom header
   * @param {Function} options.map          function to translate tag into a different tag
   */
  ;

  _proto.addTagMapper = function addTagMapper(options) {
    this.parseStream.addTagMapper(options);
  };

  return Parser;
}(Stream__default['default']);

exports.LineStream = LineStream;
exports.ParseStream = ParseStream;
exports.Parser = Parser;

},{"@babel/runtime/helpers/assertThisInitialized":5,"@babel/runtime/helpers/extends":6,"@babel/runtime/helpers/inheritsLoose":7,"@videojs/vhs-utils/cjs/decode-b64-to-uint8-array.js":10,"@videojs/vhs-utils/cjs/stream.js":11}],"p2p-media-loader-hlsjs":[function(require,module,exports){
"use strict";
/**
 * @license Apache-2.0
 * Copyright 2018 Novage LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initJwPlayer = exports.initMediaElementJsPlayer = exports.initVideoJsHlsJsPlugin = exports.initVideoJsContribHlsJsPlayer = exports.initFlowplayerHlsJsPlayer = exports.initClapprPlayer = exports.initHlsJsPlayer = exports.version = void 0;
/* eslint-disable */
exports.version = "0.6.2";
__exportStar(require("./engine"), exports);
__exportStar(require("./segment-manager"), exports);
function initHlsJsPlayer(player) {
    if (player && player.config && player.config.loader && typeof player.config.loader.getEngine === "function") {
        initHlsJsEvents(player, player.config.loader.getEngine());
    }
}
exports.initHlsJsPlayer = initHlsJsPlayer;
function initClapprPlayer(player) {
    player.on("play", () => {
        const playback = player.core.getCurrentPlayback();
        if (playback._hls && !playback._hls._p2pm_linitialized) {
            playback._hls._p2pm_linitialized = true;
            initHlsJsPlayer(player.core.getCurrentPlayback()._hls);
        }
    });
}
exports.initClapprPlayer = initClapprPlayer;
function initFlowplayerHlsJsPlayer(player) {
    player.on("ready", () => { var _a; return initHlsJsPlayer((_a = player.engine.hlsjs) !== null && _a !== void 0 ? _a : player.engine.hls); });
}
exports.initFlowplayerHlsJsPlayer = initFlowplayerHlsJsPlayer;
function initVideoJsContribHlsJsPlayer(player) {
    player.ready(() => {
        const options = player.tech_.options_;
        if (options &&
            options.hlsjsConfig &&
            options.hlsjsConfig.loader &&
            typeof options.hlsjsConfig.loader.getEngine === "function") {
            initHlsJsEvents(player.tech_, options.hlsjsConfig.loader.getEngine());
        }
    });
}
exports.initVideoJsContribHlsJsPlayer = initVideoJsContribHlsJsPlayer;
function initVideoJsHlsJsPlugin() {
    if (videojs == undefined || videojs.Html5Hlsjs == undefined) {
        return;
    }
    videojs.Html5Hlsjs.addHook("beforeinitialize", (videojsPlayer, hlsjs) => {
        if (hlsjs.config && hlsjs.config.loader && typeof hlsjs.config.loader.getEngine === "function") {
            initHlsJsEvents(hlsjs, hlsjs.config.loader.getEngine());
        }
    });
}
exports.initVideoJsHlsJsPlugin = initVideoJsHlsJsPlugin;
function initMediaElementJsPlayer(mediaElement) {
    mediaElement.addEventListener("hlsFragChanged", (event) => {
        const hls = mediaElement.hlsPlayer;
        if (hls && hls.config && hls.config.loader && typeof hls.config.loader.getEngine === "function") {
            const engine = hls.config.loader.getEngine();
            if (event.data && event.data.length > 1) {
                const frag = event.data[1].frag;
                const byteRange = frag.byteRange.length !== 2
                    ? undefined
                    : { offset: frag.byteRange[0], length: frag.byteRange[1] - frag.byteRange[0] };
                engine.setPlayingSegment(frag.url, byteRange, frag.start, frag.duration);
            }
        }
    });
    mediaElement.addEventListener("hlsDestroying", async () => {
        const hls = mediaElement.hlsPlayer;
        if (hls && hls.config && hls.config.loader && typeof hls.config.loader.getEngine === "function") {
            const engine = hls.config.loader.getEngine();
            await engine.destroy();
        }
    });
    mediaElement.addEventListener("hlsError", (event) => {
        const hls = mediaElement.hlsPlayer;
        if (hls && hls.config && hls.config.loader && typeof hls.config.loader.getEngine === "function") {
            if (event.data !== undefined && event.data.details === "bufferStalledError") {
                const engine = hls.config.loader.getEngine();
                engine.setPlayingSegmentByCurrentTime(hls.media.currentTime);
            }
        }
    });
}
exports.initMediaElementJsPlayer = initMediaElementJsPlayer;
function initJwPlayer(player, hlsjsConfig) {
    const iid = setInterval(() => {
        if (player.hls && player.hls.config) {
            clearInterval(iid);
            Object.assign(player.hls.config, hlsjsConfig);
            initHlsJsPlayer(player.hls);
        }
    }, 200);
}
exports.initJwPlayer = initJwPlayer;
function initHlsJsEvents(player, engine) {
    player.on("hlsFragChanged", (_event, data) => {
        const frag = data.frag;
        const byteRange = frag.byteRange.length !== 2
            ? undefined
            : { offset: frag.byteRange[0], length: frag.byteRange[1] - frag.byteRange[0] };
        engine.setPlayingSegment(frag.url, byteRange, frag.start, frag.duration);
    });
    player.on("hlsDestroying", async () => {
        await engine.destroy();
    });
    player.on("hlsError", (_event, errorData) => {
        if (errorData.details === "bufferStalledError") {
            const htmlMediaElement = (player.media === undefined
                ? player.el_ // videojs-contrib-hlsjs
                : player.media); // all others
            if (htmlMediaElement) {
                engine.setPlayingSegmentByCurrentTime(htmlMediaElement.currentTime);
            }
        }
    });
}

},{"./engine":2,"./segment-manager":4}]},{},[1]);
