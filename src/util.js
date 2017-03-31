export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
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
      parent.appendChild(child);
    }
  }

  return parent;
}

export function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

export function debounce(fn, wait, immediate) {
  let timeoutID;
  let lastArguments;

  function timeout() {
    if (lastArguments) {
      fn.apply(this, lastArguments);
      lastArguments = null;
      timeoutID = setTimeout(timeout, wait);
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
    else {
      clearTimeout(timeoutID);
      timeoutID = setTimeout(timeout, wait);
    }
  };
}

export function throttle(fn, wait) {
  let timeoutID;
  let lastArguments;

  function timeout() {
    if (lastArguments) {
      fn.apply(this, lastArguments);
      lastArguments = null;
      timeoutID = setTimeout(timeout, wait);
    }
    else {
      timeoutID = null;
    }
  }

  return function() {
    lastArguments = arguments;
    if (!timeoutID) {
      timeout();
    }
    else {
      lastArguments = arguments;
    }
  };
}
