const os = require('os')
const original = os.networkInterfaces
os.networkInterfaces = function patchedNetworkInterfaces() {
  try {
    return original.call(os)
  } catch {
    return { lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }] }
  }
}
