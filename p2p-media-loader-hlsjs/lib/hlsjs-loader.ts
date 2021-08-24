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

import { SegmentManager } from "./segment-manager";
import type { LoaderCallbacks, LoaderConfiguration, LoaderContext, LoaderStats } from "hls.js";
import { Events } from "p2p-media-loader-core";

const DEFAULT_DOWNLOAD_LATENCY = 1;
const DEFAULT_DOWNLOAD_BANDWIDTH = 12500; // bytes per millisecond

type HlsJsV0Stats = {
    trequest: number;
    tfirst: number;
    tload: number;
    tparsed: number;
    loaded: number;
    total: number;
};

export class HlsJsLoader {
    private isLoaded = false;
    private segmentManager: SegmentManager;
    public stats: HlsJsV0Stats & LoaderStats = {
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

    public constructor(segmentManager: SegmentManager) {
        this.segmentManager = segmentManager;
    }

    public async load(
        context: LoaderContext,
        _config: LoaderConfiguration,
        callbacks: LoaderCallbacks<LoaderContext>
    ): Promise<void> {
        const start = performance.now();
        this.stats.loading.start = start - DEFAULT_DOWNLOAD_LATENCY;
        this.stats.loading.first = start;

        if (((context as unknown) as { type: unknown }).type) {
            try {
                const result = await this.segmentManager.loadPlaylist(context.url);
                this.isLoaded = true;
                this.successPlaylist(result, context, callbacks);
            } catch (e) {
                this.error(e, context, callbacks);
            }
        } else if (((context as unknown) as { frag: unknown }).frag) {
            const { loader } = this.segmentManager;

            const updateBandwidthEstimate = () => {
                const bandwidthEstimate = loader.getBandwidthEstimate();
                // convert bytes per millisecond to bits per second
                this.stats.bwEstimate = bandwidthEstimate * 8000;
                this.stats.loaded = (performance.now() - start) * bandwidthEstimate;
            };
            loader.on(Events.PieceBytesDownloaded, updateBandwidthEstimate);

            try {
                const result = await this.segmentManager.loadSegment(context.url, getByteRange(context));
                const { content } = result;
                if (content) {
                    this.isLoaded = true;
                    setTimeout(() => this.successSegment(content, result.downloadBandwidth, context, callbacks), 0);
                }
            } catch (e) {
                setTimeout(() => this.error(e, context, callbacks), 0);
            } finally {
                loader.removeListener(Events.PieceBytesDownloaded, updateBandwidthEstimate);
            }
        } else {
            console.warn("Unknown load request", context);
        }
    }

    public abort(context: LoaderContext, callbacks?: LoaderCallbacks<LoaderContext>): void {
        if (this.isLoaded) return;

        this.segmentManager.abortSegment(context.url, getByteRange(context));
        this.stats.aborted = true;

        const onAbort = callbacks?.onAbort;
        if (onAbort) {
            onAbort(this.stats, context, undefined);
        }
    }

    private successPlaylist(
        xhr: { response: string; responseURL: string },
        context: LoaderContext,
        callbacks: LoaderCallbacks<LoaderContext>
    ): void {
        const now = performance.now();

        this.stats.trequest = now - 300;
        this.stats.tfirst = now - 200;
        this.stats.tload = now - 1;
        this.stats.loaded = xhr.response.length;
        this.stats.total = xhr.response.length;

        createUniversalStats(this.stats);

        callbacks.onSuccess(
            {
                url: xhr.responseURL,
                data: xhr.response,
            },
            this.stats,
            context,
            undefined
        );
    }

    private successSegment(
        content: ArrayBuffer,
        downloadBandwidth: number | undefined,
        context: LoaderContext,
        callbacks: LoaderCallbacks<LoaderContext>
    ): void {
        const now = performance.now();
        const downloadTime =
            content.byteLength /
            (downloadBandwidth === undefined || downloadBandwidth <= 0
                ? DEFAULT_DOWNLOAD_BANDWIDTH
                : downloadBandwidth);

        this.stats.trequest = now - DEFAULT_DOWNLOAD_LATENCY - downloadTime;
        this.stats.tfirst = now - downloadTime;
        this.stats.tload = now - 1;
        this.stats.loaded = content.byteLength;
        this.stats.total = content.byteLength;
        // convert bytes per millisecond to bits per second
        this.stats.bwEstimate = (downloadBandwidth ?? DEFAULT_DOWNLOAD_BANDWIDTH) * 8000;

        createUniversalStats(this.stats);

        if (callbacks.onProgress) {
            callbacks.onProgress(this.stats, context, content, undefined);
        }

        callbacks.onSuccess(
            {
                url: context.url,
                data: content,
            },
            this.stats,
            context,
            undefined
        );
    }

    private error(
        error: { code: number; text: string },
        context: LoaderContext,
        callbacks: LoaderCallbacks<LoaderContext>
    ): void {
        callbacks.onError(error, context, undefined);
    }
}

/**
 * Create universal stats entity for both hls.js v0 and v1
 * @param stats hls.js v0 stats
 */
function createUniversalStats(stats: HlsJsV0Stats & LoaderStats) {
    stats.loading.start = stats.trequest;
    stats.loading.first = stats.tfirst;
    stats.loading.end = stats.tload;
}

function getByteRange(context: LoaderContext) {
    return context.rangeEnd && context.rangeStart !== undefined
        ? { offset: context.rangeStart, length: context.rangeEnd - context.rangeStart }
        : undefined;
}
