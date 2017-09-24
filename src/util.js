import * as THREE from 'three';

export function request(url, responseType = 'json') {
  const r = new XMLHttpRequest();
  r.responseType = responseType;
  r.open('GET', url);

  const promise = new Promise((resolve, reject) => {
    r.onreadystatechange = () => {

      if (r.readyState !== XMLHttpRequest.DONE) {
        return;
      }

      THREE.DefaultLoadingManager.itemEnd(url);

      if (r.status === 200) {
        resolve(r.response);
      }
      else {
        THREE.DefaultLoadingManager.itemError(url);
        reject(r.status);
      }
    };
  });

  THREE.DefaultLoadingManager.itemStart(url);

  r.send();

  return {
    promise,
    abort: () => r.abort()
  };
}

export function detachableEvents(...events) {
  const removeEvents = [];
  for (let e of events) {
    e.element.addEventListener(e.type, e.callback);
    removeEvents.push(() => {
      e.element.removeEventListener(e.type, e.callback);
    });
  }
  return () => {
    for (let remove of removeEvents) {
      remove();
    }
  };
}

export function emptyNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function setAttribs(elem, attribs) {
  for (let name in attribs) {
    elem.setAttribute(name, attribs[name]);
  }
}

export function createElem(name, attribs, htmlContent) {
  const elem = document.createElement(name);
  if (attribs) {
    setAttribs(elem, attribs);
  }
  if (htmlContent) {
    elem.innerHTML = htmlContent;
  }

  return elem;
}

export function buildDomTree(parent, children) {
  for (let [i, child] of children.entries()) {
    if (child instanceof Array) {
      buildDomTree(children[i - 1], child);
    }
    else {
      if (!(child instanceof Node)) {
        child = document.createTextNode(child);
      }
      parent.appendChild(child);
    }
  }

  return parent;
}

export function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

export function mod(x, n) {
  return ((x % n) + n) % n;
}

function limiter(fn, waitTime, immediate, debounce, timeoutFn, clearTimeoutFn) {
  let timeoutID;
  let currentArguments;

  function timeout() {
    if (currentArguments) {
      fn.apply(this, currentArguments);
      currentArguments = null;
      timeoutID = timeoutFn(timeout, waitTime);
    }
    else {
      timeoutID = null;
    }
  }

  return function() {
    currentArguments = arguments;
    if (immediate && !timeoutID) {
      timeout();
    }
    else if (debounce) {
      clearTimeoutFn(timeoutID);
      timeoutID = timeoutFn(timeout, waitTime);
    }
  };
}

export function debounce(fn, waitTime, immediate) {
  return limiter(fn, waitTime, immediate, true, setTimeout, clearTimeout);
}

export function throttle(fn, waitTime) {
  return limiter(fn, waitTime, true, false, setTimeout, clearTimeout);
}

export function throttleAnimationFrame(fn) {
  return limiter(fn, null, true, false, requestAnimationFrame, cancelAnimationFrame);
}
