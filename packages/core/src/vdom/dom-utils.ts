export function replaceElementsOf(
  parent: HTMLElement,
  newChildren: Node | Node[]
) {
  if (Array.isArray(newChildren)) {
    parent.replaceChildren(...newChildren);
  } else {
    parent.replaceChildren(newChildren);
  }
}

export function elementsToFragment(elm: Node | Node[]): Node {
  if (Array.isArray(elm) && elm.length === 1) {
    return elm[0];
  }

  if (Array.isArray(elm)) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < elm.length; i++) {
      frag.appendChild(elm[i]);
    }
    return frag;
  }

  return elm;
}

// Inclusive range removal helper
export function removeElementRange(parent: Node, start: Node, end: Node) {
  let cur: Node | null = start;
  while (cur) {
    const next: ChildNode | null = cur === end ? null : cur.nextSibling;
    parent.removeChild(cur);
    if (cur === end) break;
    cur = next;
  }
}

export function setElementProp(elm: HTMLElement, key: string, value: unknown) {
  (elm as any)[key] = value;
}

export function setElementAttr(
  elm: HTMLElement,
  key: string,
  value: string | null
) {
  if (value === null) {
    elm.removeAttribute(key);
  } else {
    elm.setAttribute(key, value);
  }
}

export function setElementStyle(
  elm: HTMLElement,
  value: string | Record<string, unknown> | null
) {
  if (value === null) {
    elm.removeAttribute("style");
    return;
  }

  if (typeof value === "string") {
    elm.setAttribute("style", value);
    return;
  }

  for (const style in value) {
    (elm as any).style[style] = value[style];
  }
}

export function isEventProp(name: string): boolean {
  return name.length > 2 && name[0] === "o" && name[1] === "n";
}

export function setElementClass(
  elm: HTMLElement,
  value: string | Record<string, boolean> | null | undefined
) {
  if (value === null || value === undefined) {
    elm.className = "";
    return;
  }

  if (typeof value === "string") {
    elm.className = value;
    return;
  }

  // Handle object notation: { "class-name": true, "other-class": false }
  const classes = Object.keys(value)
    .filter((key) => value[key])
    .join(" ");

  elm.className = classes;
}
