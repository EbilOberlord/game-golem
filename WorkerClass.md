# Introduction #

The Worker class is the workhorse of the script. Everything that happens should be part of a worker - and workers should try not to rely on other workers any more than they really have to.

Workers have a very set flow of how to behave - following this will make debugging easier and reduce later problems...

# Details #

Workers have a number of private functions which anyone can call (but shouldn't unless they know what they're doing), and public functions which should be overloaded as needed. Any "extra" functions can be created, but must not clash with anything else...

Worker.data is only available in certain situations - for the rest of the time it will be empty. Worker.option is always available, so store "state" data in there (deciding to work etc).

## Framework ##

This is the basic framework for a worker. Simply copy this and change the name (find and replace "myWorker" - even the text needs to be the same correct name).

Apart from the initial variable definition every part is optional and may be left out.

If your worker is never going to need stored data or options then make them equal `null` instead.

## Source ##

```
var myWorker = new Worker('myWorker', '*', {});

myWorker.data = {}; // May be null if we never use it
myWorker.option = {}; // May be null if we never use it

myWorker.init = function() {
};

myWorker.parse = function(change) {
   if (!change) {
      // Do not make any changes to the page
   } else {
      // Safe to make changes to the page
   }
   return true; // If we don't want to change anything then return false instead
};

myWorker.work = function(state) {
   // this .data is not available
   if (!state) {
      return true; // Check if we need to work and return true if we do, otherwise return false
   }
   // this.data is now available
   return false; // Change to true and let the check at the top decide if we keep focus
};

myWorker.update = function(type) {
};
```

# Flow #

Flow occurs like so -

| **Action** | **.data** | **Notes** |
|:-----------|:----------|:----------|
| .init()    | true      | The only time all workers .data is directly available |
| .parse(false) | true      | Must never change the page, must return true if that is needed |
| .parse(true) | true      | Can change the page, only called if .parse(false) returned true |
| .work(false) | false     | Decide if we need focus, return true if we do, but doesn't guarantee we get it. At this point .data is null |
| .work(true) | true      | We have focus, do anything you like, don't return false till finished. At this point .data is available |
| .update(null,null) | true      | This is only called once called after init() so is a good time to update any runtime variables |
| .update('data',null) | true      | Our data is about to be saved as something changed. This is the best place to create the state data and decide if we want to work later |
| .update('option',null) | true      | As above, only .options has changed |
| .update('runtime',null) | true      | As above, only .runtime has changed |
| .update('reminder',null) | true      | We've asked for a `_`remind() or `_`revive() and are being reminded |
| .update(`*`, worker) | true      | A worker we are `_`watch()'ing has had something change (types as above). When worker is null it always means ourselves. |
| .dashboard() | true      | Called from worker\_dashboard. See other source files for examples |


# Private Stuff #

## this.`_`changed ##

The time of the last change to our data in milliseconds, same as Date.now().

## this.`_`remind(seconds) ##

After a delay calls _worker_.`_`update('reminder',null) once.

## this.`_`revive(seconds) ##

Every xx seconds calls _worker_.`_`update('reminder',null).

## this.`_`watch(_worker_) ##

This function allows us to watch other Workers for changes. Basically if their .update() gets called, then ours will get called afterwards.

This is a very useful function to use if our state changes depending on the information in another worked.

It is used by worker\_dashboard to "guess" when the contents of your dashboard page have changed and ask for an update.

## _worker_.get('key') ##

This is the only safe way to obtain information from another worker. As example is getting the level of the player - `Player.get('level')`

This function can be overwritten by our own function - if for example we could supply some information that took effort to work out, but only wanted to work it out when it was wanted (worker\_player makes extensive use of this). It is suggested that overloading it will fall back to the internal function if needed.

```
myWorker.get = function(what) {
   return this._get(what);
};
```

## Other Private Functions ##

There are some other private functions, however they should not be used or altered without a lot of knowledge, hence they are not described here. Read the source of worker.js and see where they are used.

If you cannot work out what they do or how they do it then it is not safe to touch them.