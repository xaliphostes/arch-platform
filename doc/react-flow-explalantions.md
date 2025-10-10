# React Data Flow: How Slider Changes Trigger generateContours()

## The Complete Flow

Here's what happens when you move the "Number of Contours" slider:

```
User moves slider
    ↓
Browser fires 'input' event
    ↓
RightPanel's onChange handler
    ↓
setNumContours(newValue) called
    ↓
SceneContext state updates
    ↓
React re-renders all consumers
    ↓
ThreeScene re-renders
    ↓
useEffect detects numContours change
    ↓
generateContours() is called
    ↓
New 3D geometry is created
```

## Step-by-Step Explanation

### 1. **User Interaction (DOM Event)**
```typescript
// In RightPanel.tsx
<input 
    type="range" 
    value={numContours}
    onChange={(e) => setNumContours(Number(e.target.value))}
/>
```

When you move the slider:
- The browser fires an `input` or `change` event
- React's synthetic event system captures it
- The `onChange` handler is invoked with the event object

### 2. **State Update Request**
```typescript
setNumContours(Number(e.target.value))
```

This calls the setter function from the context:
- `setNumContours` is from `useState` in SceneContext
- It's a **request** to update state, not immediate
- React schedules a re-render

### 3. **Context State Update (SceneContext.tsx)**
```typescript
const [numContours, setNumContours] = useState(10)
```

When `setNumContours` is called:
- React compares the new value with the old value
- If different, React marks the component as needing re-render
- The new state value is queued

### 4. **Re-render Phase**
React re-renders all components that consume this context value:

```typescript
// In ThreeScene.tsx
const { displayMode, numContours, colorTable } = useScene()
```

The `useScene()` hook subscribes ThreeScene to context changes:
- When `numContours` changes in context
- React knows ThreeScene depends on it
- React schedules ThreeScene to re-render

### 5. **Effect Detection (useEffect)**
```typescript
// In ThreeScene.tsx
useEffect(() => {
    generateContours()
}, [displayMode, numContours, colorTable])
```

**How useEffect works:**
- React keeps track of the dependency array `[displayMode, numContours, colorTable]`
- After each render, React compares current values with previous values
- If `numContours` changed: React runs the effect callback
- The callback calls `generateContours()`

### 6. **Geometry Regeneration**
```typescript
const generateContours = () => {
    // Clear old meshes
    // Calculate new iso-contour levels based on numContours
    // Create new geometry with keplerlit functions
    // Add new meshes to scene
}
```

The function executes synchronously and updates the Three.js scene.

---

## Key React Concepts Used

### 1. **Context API**
Provides a way to share state across components without prop drilling:

```typescript
// SceneProvider wraps the entire app
<SceneProvider>
    <LeftPanel />
    <ThreeScene />
    <RightPanel />
</SceneProvider>
```

All three components can access the same state through `useScene()`.

### 2. **useState Hook**
Manages state in functional components:

```typescript
const [numContours, setNumContours] = useState(10)
```

- `numContours`: current value
- `setNumContours`: function to update it
- When called, triggers re-render of component and all consumers

### 3. **useEffect Hook**
Runs side effects in response to state changes:

```typescript
useEffect(() => {
    // This runs when dependencies change
    generateContours()
}, [displayMode, numContours, colorTable])
```

**Dependency array behavior:**
- Empty `[]`: runs once on mount
- No array: runs after every render
- `[a, b, c]`: runs when a, b, or c change

### 4. **useContext Hook**
Subscribes to context changes:

```typescript
const { numContours, setNumContours } = useScene()
```

When context value changes, component re-renders automatically.

---

## Visual Timeline

```
Time: 0ms     User moves slider
Time: 0ms     onChange fires immediately
Time: 0ms     setNumContours(15) called
              
Time: ~16ms   React batches updates and re-renders
              (during next animation frame)
              
Time: ~16ms   Context updates: numContours: 10 → 15
              
Time: ~16ms   RightPanel re-renders
              (slider shows new value: 15)
              
Time: ~16ms   ThreeScene re-renders
              (receives new numContours value)
              
Time: ~16ms   useEffect detects change
              (previous: [10], current: [15])
              
Time: ~16ms   generateContours() executes
              - Clears old meshes
              - Creates 15 iso-contour levels
              - Generates new geometry
              - Adds to Three.js scene
              
Time: ~33ms   Next frame renders with new contours
```

---

## Why This Design?

### **Separation of Concerns**
- **RightPanel**: UI controls (doesn't know about Three.js)
- **ThreeScene**: 3D rendering (doesn't know about UI)
- **SceneContext**: State management (connects them)

### **Automatic Synchronization**
- No manual event listeners needed
- No callbacks to pass through props
- State change automatically propagates

### **Performance**
- React batches multiple state updates
- useEffect prevents unnecessary recalculations
- Only re-renders affected components

---

## Common Questions

**Q: Why not call generateContours() directly in onChange?**

A: That would work, but breaks React's patterns:
```typescript
// Anti-pattern
onChange={(e) => {
    setNumContours(Number(e.target.value))
    generateContours() // Wrong! Multiple responsibilities
}}
```

Better to keep concerns separated and let React handle the flow.

**Q: What if multiple sliders change at once?**

A: React batches updates! If you change `numContours` and `displayMode` in quick succession, React combines them into one re-render and one `generateContours()` call.

**Q: Can I debounce the updates?**

A: Yes! You could add debouncing in the onChange handler:
```typescript
const debouncedSetNumContours = useMemo(
    () => debounce(setNumContours, 300),
    []
)
```

This would delay the state update until the user stops moving the slider.