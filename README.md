# autoswarm

If you glued together [Automerge](https://github.com/automerge/automerge) and [Hyperswarm](https://github.com/hyperswarm/hyperswarm), you might get an autoswarm - a really simple way to sync a JSON document over the web, automagically.

## Example Usage

```javascript
const { Autoswarm } = require("./index.js")

// Helpers for logging
const sortedObject = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {})
const startTime = Date.now()
function log_state(machine, autoswarm) {
    let data = JSON.stringify(sortedObject(autoswarm.get()))
    let elapsed = (Date.now() - startTime).toString().padStart(4, ' ')
    console.log(`[${elapsed}ms] - Machine ${machine}: ${data}`)
}

// Create a new Autoswarm object
const autoswarm = new Autoswarm("my-unique-topic-name")
autoswarm.change(doc => {
    doc.x = 1
    doc.y = { moreData: [1, 2, 3] }
})
log_state("A", autoswarm)

// On the same machine, or another machine
const autoswarm2 = new Autoswarm("my-unique-topic-name")
autoswarm2.change(doc => { doc.z = "zebras" })
log_state("B", autoswarm2)

setTimeout(() => {
    log_state("B", autoswarm2)
    autoswarm2.change(doc => {
        doc.y.moreData[1] = "two"
    })
    log_state("B", autoswarm2)
}, 200)

// On first machine again
setTimeout(() => {
    log_state("A", autoswarm)
}, 400)

// Cleanup
setTimeout(() => {
    autoswarm.close()
    autoswarm2.close()
}, 500)
```
```[  30ms] - Machine A: {"x":1,"y":{"moreData":[1,2,3]}}
[  59ms] - Machine B: {"z":"zebras"}
[ 308ms] - Machine B: {"x":1,"y":{"moreData":[1,2,3]},"z":"zebras"}
[ 315ms] - Machine B: {"x":1,"y":{"moreData":[1,"two",3]},"z":"zebras"}
[ 512ms] - Machine A: {"x":1,"y":{"moreData":[1,"two",3]},"z":"zebras"}
```

