const {parentPort, workerData} = require('worker_threads')

const safeEvaluation =(expr) => {
    try {
        return eval(expr)
    } catch (e) {
        return e.message
    }
}

const output = safeEvaluation(workerData)
parentPort.postMessage(output)

