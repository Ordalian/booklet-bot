import { useState, useCallback, useRef } from "react";
import { EditorElement, BrandConfig, DEFAULT_BRAND, createId, A4_WIDTH, A4_HEIGHT } from "./types";

const MAX_HISTORY = 50;

export function useEditorState(initialElements: EditorElement[] = []) {
  const [elements, setElements] = useState<EditorElement[]>(initialElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(DEFAULT_BRAND);

  const historyRef = useRef<EditorElement[][]>([initialElements]);
  const historyIndexRef = useRef(0);

  const pushHistory = useCallback((newElements: EditorElement[]) => {
    const idx = historyIndexRef.current;
    const newHistory = historyRef.current.slice(0, idx + 1);
    newHistory.push(newElements);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
  }, []);

  const updateElements = useCallback((newElements: EditorElement[]) => {
    setElements(newElements);
    pushHistory(newElements);
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setElements(historyRef.current[historyIndexRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setElements(historyRef.current[historyIndexRef.current]);
    }
  }, []);

  const addElement = useCallback((type: EditorElement["type"], overrides?: Partial<EditorElement>) => {
    const base: EditorElement = {
      id: createId(),
      type,
      x: A4_WIDTH / 2 - 75,
      y: A4_HEIGHT / 2 - 25,
      width: 150,
      height: 50,
      rotation: 0,
      fill: "#333333",
      stroke: "",
      strokeWidth: 0,
      opacity: 1,
      visible: true,
      locked: false,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      ...overrides,
    };

    if (type === "text") {
      base.text = "Texte";
      base.fontSize = 24;
      base.fontFamily = "Arial";
      base.fontStyle = "normal";
      base.textAlign = "left";
      base.fill = "#000000";
      base.width = 200;
      base.height = 40;
    } else if (type === "rect") {
      base.width = 150;
      base.height = 100;
      base.fill = "#E85D04";
      base.cornerRadius = 0;
    } else if (type === "circle") {
      base.width = 100;
      base.height = 100;
      base.fill = "#0077B6";
    } else if (type === "image") {
      base.width = 200;
      base.height = 150;
      base.fill = undefined;
    } else if (type === "line") {
      base.points = [0, 0, 200, 0];
      base.stroke = "#000000";
      base.strokeWidth = 2;
      base.width = 200;
      base.height = 4;
    }

    Object.assign(base, overrides);
    const newEls = [...elements, base];
    updateElements(newEls);
    setSelectedId(base.id);
    return base.id;
  }, [elements, updateElements]);

  const updateElement = useCallback((id: string, changes: Partial<EditorElement>) => {
    const newEls = elements.map(el => el.id === id ? { ...el, ...changes } : el);
    updateElements(newEls);
  }, [elements, updateElements]);

  // Group-aware delete: if element has groupId, delete entire group
  const deleteElement = useCallback((id: string) => {
    const el = elements.find(e => e.id === id);
    if (el?.groupId) {
      updateElements(elements.filter(e => e.groupId !== el.groupId));
    } else {
      updateElements(elements.filter(e => e.id !== id));
    }
    if (selectedId === id) setSelectedId(null);
  }, [elements, selectedId, updateElements]);

  const moveLayer = useCallback((id: string, direction: "up" | "down" | "top" | "bottom") => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx === -1) return;
    const newEls = [...elements];
    const [el] = newEls.splice(idx, 1);
    if (direction === "top") newEls.push(el);
    else if (direction === "bottom") newEls.unshift(el);
    else if (direction === "up" && idx < newEls.length) newEls.splice(idx + 1, 0, el);
    else if (direction === "down" && idx > 0) newEls.splice(idx - 1, 0, el);
    else newEls.splice(idx, 0, el);
    updateElements(newEls);
  }, [elements, updateElements]);

  // Group-aware duplicate: duplicate entire group with new groupId
  const duplicateElement = useCallback((id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;

    if (el.groupId) {
      const groupEls = elements.filter(e => e.groupId === el.groupId);
      const newGroupId = createId();
      const newEls = groupEls.map(e => ({
        ...e,
        id: createId(),
        groupId: newGroupId,
        x: e.x + 20,
        y: e.y + 20,
        name: (e.name || "") + " copy",
      }));
      updateElements([...elements, ...newEls]);
      setSelectedId(newEls[0]?.id || null);
    } else {
      const newEl = { ...el, id: createId(), x: el.x + 20, y: el.y + 20, name: (el.name || "") + " copy" };
      updateElements([...elements, newEl]);
      setSelectedId(newEl.id);
    }
  }, [elements, updateElements]);

  return {
    elements,
    selectedId,
    setSelectedId,
    brandConfig,
    setBrandConfig,
    addElement,
    updateElement,
    deleteElement,
    moveLayer,
    duplicateElement,
    undo,
    redo,
    setElements: updateElements,
  };
}
