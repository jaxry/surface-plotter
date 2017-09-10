import { emptyNode, createElem, buildDomTree } from '../util';

export default class {
  constructor() {
    this.tabList = createElem('ul', {class: 'tabList'});
    this.contentContainer = createElem('div', {class: 'activeContent'});

    this._contentById = new Map();
    this.domElement = buildDomTree(
      createElem('div', {class: 'tabs'}), [
        this.tabList,
        this.contentContainer
      ]
    );
  }

  _tabClick(id) {
    return () => this.selectTab(id);
  }

  selectTab(id) {
    const {tab, content, callback} = this._contentById.get(id);

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
    tab.addEventListener('click', this._tabClick(id));
    this.tabList.appendChild(tab);

    this._contentById.set(id, {
      tab: tab,
      content: domElement,
      callback: callback
    });

    if (this._contentById.size === 1) {
      this.selectTab(id);
    }
  }
}