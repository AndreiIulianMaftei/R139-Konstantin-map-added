// // Advanced XP Components & Utilities
// // src/components/advanced/XPContextMenu.js

// import React, { useState, useEffect, useRef } from 'react';
// import { XPIcons } from '../icons/XPIcons';

// export const XPContextMenu = ({ 
//   x, 
//   y, 
//   items = [], 
//   onClose, 
//   onSelect,
//   className = ''
// }) => {
//   const menuRef = useRef(null);
//   const [selectedIndex, setSelectedIndex] = useState(-1);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (menuRef.current && !menuRef.current.contains(event.target)) {
//         onClose();
//       }
//     };

//     const handleKeyDown = (event) => {
//       switch (event.key) {
//         case 'Escape':
//           onClose();
//           break;
//         case 'ArrowDown':
//           event.preventDefault();
//           setSelectedIndex(prev => 
//             prev < items.length - 1 ? prev + 1 : 0
//           );
//           break;
//         case 'ArrowUp':
//           event.preventDefault();
//           setSelectedIndex(prev => 
//             prev > 0 ? prev - 1 : items.length - 1
//           );
//           break;
//         case 'Enter':
//           event.preventDefault();
//           if (selectedIndex >= 0 && items[selectedIndex]) {
//             handleSelect(items[selectedIndex]);
//           }
//           break;
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     document.addEventListener('keydown', handleKeyDown);
    
//     // Focus the menu for keyboard navigation
//     if (menuRef.current) {
//       menuRef.current.focus();
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//       document.removeEventListener('keydown', handleKeyDown);
//     };
//   }, [onClose, selectedIndex, items]);

//   const handleSelect = (item) => {
//     if (item.disabled || item.type === 'separator') return;
//     onSelect && onSelect(item);
//     onClose();
//   };

//   return (
//     <div
//       ref={menuRef}
//       className={`xp-context-menu ${className}`}
//       style={{
//         position: 'fixed',
//         left: x,
//         top: y,
//         zIndex: 2000
//       }}
//       tabIndex={-1}
//     >
//       <div className="context-menu-content">
//         {items.map((item, index) => (
//           item.type === 'separator' ? (
//             <div key={index} className="context-menu-separator" />
//           ) : (
//             <div
//               key={index}
//               className={`context-menu-item ${
//                 item.disabled ? 'disabled' : ''
//               } ${index === selectedIndex ? 'highlighted' : ''}`}
//               onClick={() => handleSelect(item)}
//               onMouseEnter={() => setSelectedIndex(index)}
//             >
//               <span className="menu-item-icon">
//                 {item.icon}
//               </span>
//               <span className="menu-item-label">
//                 {item.label}
//               </span>
//               {item.shortcut && (
//                 <span className="menu-item-shortcut">
//                   {item.shortcut}
//                 </span>
//               )}
//               {item.submenu && (
//                 <span className="menu-item-arrow">▶</span>
//               )}
//             </div>
//           )
//         ))}
//       </div>
//     </div>
//   );
// };

// // src/components/advanced/XPTreeView.js
// export const XPTreeView = ({ 
//   data = [], 
//   onSelect, 
//   onExpand,
//   selectedId,
//   className = ''
// }) => {
//   const [expandedItems, setExpandedItems] = useState(new Set());

//   const toggleExpanded = (id) => {
//     const newExpanded = new Set(expandedItems);
//     if (newExpanded.has(id)) {
//       newExpanded.delete(id);
//     } else {
//       newExpanded.add(id);
//     }
//     setExpandedItems(newExpanded);
//     onExpand && onExpand(id, newExpanded.has(id));
//   };

//   const renderTreeItem = (item, level = 0) => {
//     const isExpanded = expandedItems.has(item.id);
//     const hasChildren = item.children && item.children.length > 0;

//     return (
//       <div key={item.id} className="tree-item-container">
//         <div 
//           className={`tree-item ${selectedId === item.id ? 'selected' : ''}`}
//           style={{ paddingLeft: level * 20 + 8 }}
//           onClick={() => onSelect && onSelect(item)}
//         >
//           <span 
//             className={`tree-expander ${hasChildren ? 'has-children' : 'no-children'}`}
//             onClick={(e) => {
//               e.stopPropagation();
//               if (hasChildren) toggleExpanded(item.id);
//             }}
//           >
//             {hasChildren ? (isExpanded ? '−' : '+') : ''}
//           </span>
//           <span className="tree-icon">
//             {item.icon || (hasChildren ? '📁' : '📄')}
//           </span>
//           <span className="tree-label">{item.label}</span>
//         </div>
        
//         {hasChildren && isExpanded && (
//           <div className="tree-children">
//             {item.children.map(child => renderTreeItem(child, level + 1))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className={`xp-tree-view ${className}`}>
//       {data.map(item => renderTreeItem(item))}
//     </div>
//   );
// };

// // src/components/advanced/XPListView.js
// export const XPListView = ({
//   items = [],
//   columns = [],
//   onSelect,
//   onSort,
//   selectedIds = [],
//   multiSelect = false,
//   className = ''
// }) => {
//   const [sortColumn, setSortColumn] = useState(null);
//   const [sortDirection, setSortDirection] = useState('asc');

//   const handleSort = (columnKey) => {
//     const direction = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
//     setSortColumn(columnKey);
//     setSortDirection(direction);
//     onSort && onSort(columnKey, direction);
//   };

//   const handleItemClick = (item, event) => {
//     if (multiSelect && event.ctrlKey) {
//       // Toggle selection with Ctrl+click
//       const newSelection = selectedIds.includes(item.id)
//         ? selectedIds.filter(id => id !== item.id)
//         : [...selectedIds, item.id];
//       onSelect && onSelect(newSelection);
//     } else if (multiSelect && event.shiftKey && selectedIds.length > 0) {
//       // Range selection with Shift+click
//       const lastSelectedIndex = items.findIndex(i => i.id === selectedIds[selectedIds.length - 1]);
//       const clickedIndex = items.findIndex(i => i.id === item.id);
//       const start = Math.min(lastSelectedIndex, clickedIndex);
//       const end = Math.max(lastSelectedIndex, clickedIndex);
//       const rangeIds = items.slice(start, end + 1).map(i => i.id);
//       onSelect && onSelect([...new Set([...selectedIds, ...rangeIds])]);
//     } else {
//       // Single selection
//       onSelect && onSelect(multiSelect ? [item.id] : item.id);
//     }
//   };

//   return (
//     <div className={`xp-list-view ${className}`}>
//       {/* Header */}
//       <div className="list-header">
//         {columns.map(column => (
//           <div
//             key={column.key}
//             className={`list-header-cell ${sortColumn === column.key ? 'sorted' : ''}`}
//             style={{ width: column.width || 'auto' }}
//             onClick={() => column.sortable && handleSort(column.key)}
//           >
//             <span className="header-label">{column.label}</span>
//             {sortColumn === column.key && (
//               <span className="sort-indicator">
//                 {sortDirection === 'asc' ? '▲' : '▼'}
//               </span>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Items */}
//       <div className="list-body">
//         {items.map(item => (
//           <div
//             key={item.id}
//             className={`list-item ${
//               selectedIds.includes ? selectedIds.includes(item.id) : selectedIds === item.id
//                 ? 'selected' : ''
//             }`}
//             onClick={(e) => handleItemClick(item, e)}
//           >
//             {columns.map(column => (
//               <div
//                 key={column.key}
//                 className="list-cell"
//                 style={{ width: column.width || 'auto' }}
//               >
//                 {column.render ? column.render(item[column.key], item) : item[column.key]}
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// // src/components/advanced/XPPropertyGrid.js
// export const XPPropertyGrid = ({
//   properties = [],
//   values = {},
//   onChange,
//   className = ''
// }) => {
//   const handleChange = (key, value) => {
//     onChange && onChange({ ...values, [key]: value });
//   };

//   const renderProperty = (property) => {
//     const value = values[property.key];

//     switch (property.type) {
//       case 'text':
//         return (
//           <input
//             type="text"
//             className="xp-input"
//             value={value || ''}
//             onChange={(e) => handleChange(property.key, e.target.value)}
//           />
//         );
      
//       case 'number':
//         return (
//           <input
//             type="number"
//             className="xp-input"
//             value={value || ''}
//             min={property.min}
//             max={property.max}
//             step={property.step}
//             onChange={(e) => handleChange(property.key, parseFloat(e.target.value))}
//           />
//         );
      
//       case 'boolean':
//         return (
//           <input
//             type="checkbox"
//             className="xp-checkbox"
//             checked={value || false}
//             onChange={(e) => handleChange(property.key, e.target.checked)}
//           />
//         );
      
//       case 'select':
//         return (
//           <select
//             className="xp-select"
//             value={value || ''}
//             onChange={(e) => handleChange(property.key, e.target.value)}
//           >
//             {property.options.map(option => (
//               <option key={option.value} value={option.value}>
//                 {option.label}
//               </option>
//             ))}
//           </select>
//         );
      
//       case 'color':
//         return (
//           <input
//             type="color"
//             className="xp-color-input"
//             value={value || '#000000'}
//             onChange={(e) => handleChange(property.key, e.target.value)}
//           />
//         );
      
//       default:
//         return <span>{value}</span>;
//     }
//   };

//   return (
//     <div className={`xp-property-grid ${className}`}>
//       {properties.map(property => (
//         <div key={property.key} className="property-row">
//           <div className="property-label">
//             {property.label}
//             {property.required && <span className="required">*</span>}
//           </div>
//           <div className="property-value">
//             {renderProperty(property)}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// // src/components/advanced/XPSplitter.js
// export const XPSplitter = ({
//   children,
//   direction = 'horizontal',
//   defaultSizes = [50, 50],
//   minSizes = [10, 10],
//   className = ''
// }) => {
//   const [sizes, setSizes] = useState(defaultSizes);
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragIndex, setDragIndex] = useState(-1);
//   const containerRef = useRef(null);

//   const handleMouseDown = (index, event) => {
//     setIsDragging(true);
//     setDragIndex(index);
//     event.preventDefault();
//   };

//   useEffect(() => {
//     const handleMouseMove = (event) => {
//       if (!isDragging || dragIndex < 0) return;

//       const container = containerRef.current;
//       if (!container) return;

//       const rect = container.getBoundingClientRect();
//       const total = direction === 'horizontal' ? rect.width : rect.height;
//       const position = direction === 'horizontal' 
//         ? event.clientX - rect.left 
//         : event.clientY - rect.top;

//       const percentage = (position / total) * 100;
//       const newSizes = [...sizes];
      
//       // Calculate the difference from the current position
//       const currentPosition = newSizes.slice(0, dragIndex + 1).reduce((sum, size) => sum + size, 0);
//       const diff = percentage - currentPosition;
      
//       // Apply constraints
//       const minLeft = minSizes[dragIndex];
//       const minRight = minSizes[dragIndex + 1];
//       const maxLeft = 100 - minRight - newSizes.slice(dragIndex + 2).reduce((sum, size) => sum + size, 0);
//       const maxRight = 100 - minLeft - newSizes.slice(0, dragIndex).reduce((sum, size) => sum + size, 0);
      
//       newSizes[dragIndex] = Math.max(minLeft, Math.min(maxLeft, newSizes[dragIndex] + diff));
//       newSizes[dragIndex + 1] = Math.max(minRight, Math.min(maxRight, newSizes[dragIndex + 1] - diff));
      
//       setSizes(newSizes);
//     };

//     const handleMouseUp = () => {
//       setIsDragging(false);
//       setDragIndex(-1);
//     };

//     if (isDragging) {
//       document.addEventListener('mousemove', handleMouseMove);
//       document.addEventListener('mouseup', handleMouseUp);
//     }

//     return () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, [isDragging, dragIndex, sizes, direction, minSizes]);

//   const splitterStyle = {
//     display: 'flex',
//     flexDirection: direction === 'horizontal' ? 'row' : 'column',
//     height: '100%',
//     width: '100%'
//   };

//   return (
//     <div ref={containerRef} className={`xp-splitter ${className}`} style={splitterStyle}>
//       {children.map((child, index) => (
//         <React.Fragment key={index}>
//           <div
//             className="splitter-pane"
//             style={{
//               [direction === 'horizontal' ? 'width' : 'height']: `${sizes[index]}%`,
//               overflow: 'hidden'
//             }}
//           >
//             {child}
//           </div>
          
//           {index < children.length - 1 && (
//             <div
//               className={`splitter-handle ${direction}`}
//               onMouseDown={(e) => handleMouseDown(index, e)}
//             />
//           )}
//         </React.Fragment>
//       ))}
//     </div>
//   );
// };

// // src/components/advanced/XPDataGrid.js
// export const XPDataGrid = ({
//   data = [],
//   columns = [],
//   pageSize = 50,
//   onCellEdit,
//   onRowSelect,
//   className = ''
// }) => {
//   const [currentPage, setCurrentPage] = useState(0);
//   const [editingCell, setEditingCell] = useState(null);
//   const [editValue, setEditValue] = useState('');

//   const totalPages = Math.ceil(data.length / pageSize);
//   const startIndex = currentPage * pageSize;
//   const endIndex = startIndex + pageSize;
//   const currentData = data.slice(startIndex, endIndex);

//   const handleCellDoubleClick = (rowIndex, columnKey, currentValue) => {
//     setEditingCell({ row: rowIndex, column: columnKey });
//     setEditValue(currentValue);
//   };

//   const handleCellEditSave = () => {
//     if (editingCell && onCellEdit) {
//       onCellEdit(editingCell.row + startIndex, editingCell.column, editValue);
//     }
//     setEditingCell(null);
//     setEditValue('');
//   };

//   const handleCellEditCancel = () => {
//     setEditingCell(null);
//     setEditValue('');
//   };

//   return (
//     <div className={`xp-data-grid ${className}`}>
//       {/* Grid Header */}
//       <div className="grid-header">
//         <div className="grid-row">
//           {columns.map(column => (
//             <div
//               key={column.key}
//               className="grid-cell header-cell"
//               style={{ width: column.width || 'auto' }}
//             >
//               {column.label}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Grid Body */}
//       <div className="grid-body">
//         {currentData.map((row, rowIndex) => (
//           <div
//             key={rowIndex}
//             className="grid-row"
//             onClick={() => onRowSelect && onRowSelect(row, rowIndex + startIndex)}
//           >
//             {columns.map(column => {
//               const isEditing = editingCell && 
//                 editingCell.row === rowIndex && 
//                 editingCell.column === column.key;

//               return (
//                 <div
//                   key={column.key}
//                   className="grid-cell"
//                   style={{ width: column.width || 'auto' }}
//                   onDoubleClick={() => 
//                     column.editable && 
//                     handleCellDoubleClick(rowIndex, column.key, row[column.key])
//                   }
//                 >
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       className="cell-editor"
//                       value={editValue}
//                       onChange={(e) => setEditValue(e.target.value)}
//                       onBlur={handleCellEditSave}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') handleCellEditSave();
//                         if (e.key === 'Escape') handleCellEditCancel();
//                       }}
//                       autoFocus
//                     />
//                   ) : (
//                     column.render ? column.render(row[column.key], row) : row[column.key]
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="grid-pagination">
//           <button 
//             className="xp-button"
//             disabled={currentPage === 0}
//             onClick={() => setCurrentPage(0)}
//           >
//             ⏮
//           </button>
//           <button 
//             className="xp-button"
//             disabled={currentPage === 0}
//             onClick={() => setCurrentPage(currentPage - 1)}
//           >
//             ◀
//           </button>
          
//           <span className="page-info">
//             Page {currentPage + 1} of {totalPages}
//           </span>
          
//           <button 
//             className="xp-button"
//             disabled={currentPage === totalPages - 1}
//             onClick={() => setCurrentPage(currentPage + 1)}
//           >
//             ▶
//           </button>
//           <button 
//             className="xp-button"
//             disabled={currentPage === totalPages - 1}
//             onClick={() => setCurrentPage(totalPages - 1)}
//           >
//             ⏭
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// // Export all advanced components
// export const XPAdvancedComponents = {
//   XPContextMenu,
//   XPTreeView,
//   XPListView,
//   XPPropertyGrid,
//   XPSplitter,
//   XPDataGrid
// };