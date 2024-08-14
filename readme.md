# Proxy connection reset on content too big

This is a minimal reproduction for an issue with express-http-proxy.

The app starts two servers: target (port 3001) and proxy (port 3002).

The target site has a form on the home page (`/`) that submits multipart uploads to `/post`. The `/post` endpoint checks the `content-length` header and responds with:

- success HTML when length is ≤ 100000
- failure HTML when length is > 100000 or invalid

The proxy is set to pass-through request bodies (`parseReqBody = false`) and allows up to `1gb` uploads so that the target site controls "payload too large" responses.

## Usage

1. `npm install`
1. `npm start`

### Test target site

1. Visit `http://localhost:3001/`
1. Select a file that is less than 100KB and submit
   - Expect "Success"
1. Visit `http://localhost:3001/`
1. Select a file that is slightly more than 100KB and submit
   - Expect "Content too big"
1. Visit `http://localhost:3001/`
1. Select a very large file (around 100MB should suffice)
   - Expect "Content too big"

### Test proxy

1. Visit `http://localhost:3002/`
1. Select a file that is less than 100KB and submit
   - Expect "Success"
1. Visit `http://localhost:3002/`
1. Select a file that is slightly more than 100KB and submit
   - Expect "Content too big"
1. Visit `http://localhost:3002/`
1. Select a very large file (around 100MB should suffice)
   - **CONNECTION RESET (expected content too big)**

#### Side note

Rarely, the proxy will report an error that can be caught in an express request error handler, but it often is not reported.

```
Error: write ECONNABORTED
    at afterWriteDispatched (node:internal/stream_base_commons:161:15)
    at writeGeneric (node:internal/stream_base_commons:152:3)
    at Socket._writeGeneric (node:net:954:11)
    at Socket._write (node:net:966:8)
    at doWrite (node:internal/streams/writable:596:12)
    at clearBuffer (node:internal/streams/writable:781:7)
    at Writable.uncork (node:internal/streams/writable:529:7)
    at connectionCorkNT (node:_http_outgoing:981:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:81:21) {
  errno: -4079,
  code: 'ECONNABORTED',
  syscall: 'write'
}
```
