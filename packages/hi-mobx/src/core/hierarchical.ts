const hidden = Symbol('hierarchical-meta');

export interface HNode<TNode extends HNode<TNode>> extends Object {
  [hidden]?: HMeta<TNode>;
}

type CustomMeta = Record<never, never>;

interface HMeta<TNode extends HNode<TNode>> extends Object {
  root: HNode<TNode>;
  parent: HNode<TNode>;
  isHierarchyCreated?: boolean;
  isHierarchyInitialized?: boolean;
  customMeta: CustomMeta;
}

export const getParent = <TNode extends HNode<TNode>>(node: HNode<TNode>): TNode | undefined =>
  node[hidden]?.parent as TNode;

export const getRoot = <TNode extends HNode<TNode>>(node: HNode<TNode>): TNode => node[hidden]?.root as TNode;

export const isHierarchyCreated = <TNode extends HNode<TNode>>(node: HNode<TNode>): boolean | undefined =>
  getRoot(node)?.[hidden]?.isHierarchyCreated;

export const isHierarchyInitialized = <TNode extends HNode<TNode>>(node: HNode<TNode>): boolean | undefined =>
  getRoot(node)?.[hidden]?.isHierarchyInitialized;

export const getCustomMeta = <TMeta extends CustomMeta>(node: HNode<never> | undefined): TMeta =>
  (node?.[hidden]?.customMeta || {}) as TMeta;

export const setCustomMeta = <TMeta extends CustomMeta>(
  node: HNode<never>,
  values: Partial<Record<keyof TMeta, unknown>>
): void => {
  const meta = node[hidden]?.customMeta;
  if (meta) Object.assign(meta, values);
};

/**
 * returns function that runs action for each node hierarchically, starting specified one.
 * @param getChildren
 */
export const forEachNode =
  <TNode extends HNode<TNode>, TMeta extends CustomMeta>(getChildren: (customMeta: TMeta) => Array<TNode>) =>
  /**
   * runs callback for each node hierarchically, starting specified one.
   * @param action - function to call
   * @param topNode - top node in hierarchy
   * @param childrenFirst - run action from children to parent; default - false
   */
  (action: (node: TNode) => void, topNode: TNode, childrenFirst = false): void => {
    const forNode = (node: TNode): void => {
      if (!childrenFirst) {
        action(node);
      }
      const customMeta = getCustomMeta<TMeta>(node);
      if (customMeta) {
        const allChildren = getChildren(customMeta);
        allChildren?.forEach(forNode);
      }
      if (childrenFirst) {
        action(node);
      }
    };
    forNode(topNode); // start from top node
  };

export const initNode = <TNode extends HNode<TNode>, TMeta extends CustomMeta>(
  node: HNode<TNode>,
  parent: HNode<TNode>,
  onCustomInit?: (customMeta: TMeta) => void
): void => {
  if (node[hidden]) throw new Error('Cannot initialize node twice');
  const customMeta: TMeta = {} as TMeta;
  // eslint-disable-next-line no-param-reassign
  node[hidden] = {
    parent, // apply parent as is (no parent on root)
    root: (parent && getRoot(parent)) ?? node,
    customMeta,
  };
  onCustomInit?.(customMeta);
  if (!parent) {
    // this is root
    node[hidden].isHierarchyCreated = true; // eslint-disable-line no-param-reassign
  }
};

export const markHierarchyCreated = <TNode extends HNode<TNode>>(node: TNode): void => {
  const $ = node[hidden];
  if (!$) throw new Error('Cannot process uninitialized node');
  if (!$.parent) {
    // this is root
    $.isHierarchyCreated = true;
  }
};

export const initHierarchyFromRoot = <TNode extends HNode<TNode>>(
  node: HNode<TNode>,
  onInitHierarchy: (root: TNode) => void
): void => {
  const $ = node[hidden];

  // execute only on root node (no parent)
  if ($ && !$.parent) {
    // following is processed on rootNode, when all the nodes in hierarchy (except dynamic) are created;
    if (!$.isHierarchyCreated) {
      throw new Error(`Hierarchy should be created before initialization. Call initNode before initHierarchyFromRoot`);
    }
    onInitHierarchy(node as TNode);
    $.isHierarchyInitialized = true;
  }
};
