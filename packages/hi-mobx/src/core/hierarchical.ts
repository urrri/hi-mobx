import { Nullable } from '../utils/types';

const hidden = Symbol('hierarchical-meta');

export interface HNode<TNode extends HNode<TNode>> extends Object {
  [hidden]?: HMeta<TNode>;
}

type CustomMeta = Record<never, never>;

interface HMeta<TNode extends HNode<TNode>> extends Object {
  root: HNode<TNode>;
  parent: Nullable<HNode<TNode>>;
  isHierarchyCreated?: boolean;
  isHierarchyInitialized?: boolean;
  customMeta: CustomMeta;
}

const getMeta = <TNode extends HNode<TNode>>(node: HNode<TNode> | undefined): HMeta<TNode> | undefined =>
  node?.[hidden];

export const getParent = <TNode extends HNode<TNode>>(node: HNode<TNode>): TNode | undefined =>
  getMeta(node)?.parent as TNode;

export const getRoot = <TNode extends HNode<TNode>>(node: HNode<TNode>): TNode => getMeta(node)?.root as TNode;

export const isHierarchyCreated = <TNode extends HNode<TNode>>(node: HNode<TNode>): boolean | undefined =>
  getMeta(getRoot(node))?.isHierarchyCreated;

export const isHierarchyInitialized = <TNode extends HNode<TNode>>(node: HNode<TNode>): boolean | undefined =>
  getMeta(getRoot(node))?.isHierarchyInitialized;

export const getCustomMeta = <TMeta extends CustomMeta>(
  node: HNode<never> | undefined,
  defaultMeta: TMeta = {} as TMeta
): TMeta => (getMeta(node)?.customMeta || defaultMeta) as TMeta;

export const setCustomMeta = <TMeta extends CustomMeta>(
  node: HNode<never>,
  values: Partial<Record<keyof TMeta, unknown>>
): void => {
  const meta = getMeta(node)?.customMeta;
  if (meta) Object.assign(meta, values);
};

/**
 * returns function that runs action for each node hierarchically, starting specified one.
 * @param getChildren
 */
export const forEachNode =
  <TNode extends HNode<TNode>, TMeta extends CustomMeta>(getChildren: (customMeta: TMeta) => TNode[]) =>
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
  parent: Nullable<HNode<TNode>>,
  onCustomInit?: (customMeta: TMeta) => void
): void => {
  if (getMeta(node)) throw new Error('The node is already initialized');

  const customMeta: TMeta = {} as TMeta;

  const $: HMeta<TNode> = {
    parent, // apply parent as is (no parent on root)
    root: (parent && getRoot(parent)) ?? node,
    customMeta,
  };

  node[hidden] = $; // eslint-disable-line no-param-reassign

  onCustomInit?.(customMeta);

  if (!parent) {
    // this is root
    $.isHierarchyCreated = true;
  }
};

export const markHierarchyCreated = <TNode extends HNode<TNode>>(node: TNode): void => {
  const $ = getMeta(node);
  if (!$) throw new Error('Cannot process uninitialized node');
  if (!$.parent) {
    // this is root
    $.isHierarchyCreated = true;
  }
};

export const initHierarchyIfOnRoot = <TNode extends HNode<TNode>>(
  node: HNode<TNode>,
  onInitHierarchy: (root: TNode) => void
): void => {
  const $ = getMeta(node);

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
