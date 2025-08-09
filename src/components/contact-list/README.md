# Contact List Components

This directory contains the refactored contact list components with improved architecture, performance, and user experience.

## Architecture Overview

The contact list has been modularized into smaller, focused components:

### Core Components

1. **ContactRow** (`contact-row.tsx`) - Main row component that orchestrates all sub-components
2. **ContactAvatar** (`contact-avatar.tsx`) - Avatar display with initials and color coding
3. **ContactPhoneInfo** (`contact-phone-info.tsx`) - Phone numbers with call/SMS actions
4. **ContactProfessionalInfo** (`contact-professional-info.tsx`) - Position and address information
5. **ContactMetaInfo** (`contact-meta-info.tsx`) - Group and custom fields information
6. **ContactActions** (`contact-actions.tsx`) - Action buttons (edit, share, delete, star, pin)

## Key Improvements

### 1. Performance Optimization
- **Memoization**: All components use `React.memo` for optimized rendering
- **Custom comparison functions**: Efficient shallow comparison for props
- **Virtual scrolling**: Uses `react-virtuoso` for smooth scrolling with large datasets
- **Optimized re-renders**: Components only re-render when necessary

### 2. Enhanced User Experience
- **Tooltips**: Added comprehensive tooltips for all interactive elements
- **Hover Cards**: Custom fields display in hover cards for better space utilization
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Visual Feedback**: Hover effects and transitions for better interactivity

### 3. New Features
- **Star/Pin Functionality**: Built-in support for starring and pinning contacts
- **Size Variants**: Three size variants (sm, md, lg) for different use cases
- **Status Indicators**: Visual indicators for sync status and conflicts
- **Improved Avatar System**: Color-coded avatars with initials

### 4. Code Organization
- **Separation of Concerns**: Each component has a single responsibility
- **Type Safety**: Full TypeScript support with proper interfaces
- **Reusability**: Components are designed to be reusable in different contexts
- **Maintainability**: Clear structure and naming conventions

## Component Props

### ContactRow Props
```typescript
interface ContactRowProps {
  contact: ContactUI;
  groups: GroupUI[];
  outboxById?: Record<string, { status: string; tryCount: number }>;
  onEditContact?: (contact: ContactUI) => void;
  onDeleteContact?: (id: number | string) => void;
  onShareContact?: (contact: ContactUI) => void;
  onStarContact?: (contact: ContactUI) => void;
  onPinContact?: (contact: ContactUI) => void;
  onCall?: (phoneNumber: string) => void;
  onSMS?: (phoneNumber: string) => void;
  onMaps?: (contact: ContactUI) => void;
  isStarred?: boolean;
  isPinned?: boolean;
  showStar?: boolean;
  showPin?: boolean;
  rowH?: number;
  size?: 'sm' | 'md' | 'lg';
}
```

### ContactList Props
```typescript
interface ContactListProps {
  contacts: ContactUI[];
  groups: GroupUI[];
  onEditContact?: (contact: ContactUI) => void;
  onDeleteContact?: (id: number | string) => void;
  onShareContact?: (contact: ContactUI) => void;
  onStarContact?: (contact: ContactUI) => void;
  onPinContact?: (contact: ContactUI) => void;
  outboxById?: Record<string, { status: string; tryCount: number }>;
  estimatedRowHeight?: number;
  overscan?: number;
  fixedRowHeight?: number;
  starredContacts?: Set<string | number>;
  pinnedContacts?: Set<string | number>;
  showStar?: boolean;
  showPin?: boolean;
  rowSize?: 'sm' | 'md' | 'lg';
}
```

## Usage Example

```tsx
import { ContactList } from './contact-list';

<ContactList
  contacts={contacts}
  groups={groups}
  onEditContact={handleEdit}
  onDeleteContact={handleDelete}
  onShareContact={handleShare}
  onStarContact={handleStar}
  onPinContact={handlePin}
  starredContacts={starredContacts}
  pinnedContacts={pinnedContacts}
  rowSize="md"
/>
```

## Styling

- Uses Tailwind CSS for styling
- Glass morphism effects for modern appearance
- Responsive design with mobile-first approach
- Consistent spacing and typography

## Performance Considerations

- Components are memoized to prevent unnecessary re-renders
- Virtual scrolling handles large datasets efficiently
- Debounced search to reduce database queries
- Optimized comparison functions for shallow equality

## Future Enhancements

- Add unit tests for all components
- Implement dark mode support
- Add accessibility improvements
- Implement drag and drop for reordering
- Add bulk operations support