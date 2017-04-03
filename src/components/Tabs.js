import { createElem, buildDomTree } from '../util';

function emptyNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export default class {
  constructor() {
    this.tabList = createElem('ul', {class: 'tabList'});
    this.contentContainer = createElem('div', {class: 'activeContent'});

    this.contentById = new Map();
    this.domElement = buildDomTree(
      createElem('div', {class: 'tabs'}), [
        this.tabList,
        this.contentContainer
      ]
    );
  }

  selectTab(id) {
    const {tab, content, callback} = this.contentById.get(id);

    for (let child of this.tabList.childNodes) {
      if (child === tab) {
        child.classList.add('active');
      }
      else {
        child.classList.remove('active');
      }
    }

    emptyNode(this.contentContainer);
    this.contentContainer.appendChild(content);

    if (callback) {
      callback();
    }
  }

  add(id, domElement, callback) {
    const tab = createElem('li', {class: 'tab'}, id);
    tab.addEventListener('click', () => this.selectTab(id));
    this.tabList.appendChild(tab);

    this.contentById.set(id, {
      tab: tab,
      content: domElement,
      callback: callback
    });

    if (this.contentById.size === 1) {
      this.selectTab(id);
    }
  }
}