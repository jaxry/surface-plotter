export function request(url, responseType = "text") {
  const r = new XMLHttpRequest();
  r.responseType = responseType;
  r.open('GET', url);
  return new Promise((resolve, reject) => {
    r.onreadystatechange = () => {

      if (r.readyState !== XMLHttpRequest.DONE) {
        return;
      }

      r.status === 200 ? resolve(r.response) : reject(r.status);
    };

    r.send();
  });
}

export function detachableEvents(events) {
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

export function setAttribs(elem, attribs) {
  for (let name in attribs) {
    elem.setAttribute(name, attribs[name]);
  }
}

export function createElem(name, attribs, html) {
  const elem = document.createElement(name);
  if (attribs) {
    setAttribs(elem, attribs);
  }
  if (html) {
    elem.innerHTML = html;
  }

  return elem;
}

export function buildDomTree(parent, children) {
  for (let [i, child] of children.entries()) {
    if (child instanceof Array) {
      buildDomTree(children[i-1], child);
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

function limiter(fn, wait, immediate, debounce, timeoutFn, clearTimeoutFn) {
  let timeoutID;
  let lastArguments;

  function timeout() {
    if (lastArguments) {
      fn.apply(this, lastArguments);
      lastArguments = null;
      timeoutID = timeoutFn(timeout, wait);
    }
    else {
      timeoutID = null;
    }
  }

  return function() {
    lastArguments = arguments;
    if (immediate && !timeoutID) {
      timeout();
    }
    else if (debounce) {
      clearTimeoutFn(timeoutID);
      timeoutID = timeoutFn(timeout, wait);
    }
  };
}

export function debounce(fn, wait, immediate) {
  return limiter(fn, wait, immediate, true, setTimeout, clearTimeout);
}

export function throttle(fn, wait) {
  return limiter(fn, wait, true, false, setTimeout, clearTimeout);
}

export function throttleAnimationFrame(fn) {
  return limiter(fn, null, true, false, requestAnimationFrame, cancelAnimationFrame);
}
