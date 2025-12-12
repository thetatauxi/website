# Theta Tau Website Maintenance Guide

This guide is designed to help future website chairs maintain and update the Theta Tau website. It includes instructions for common tasks and explanations of the website's structure.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Getting Started](#getting-started)
3. [Common Maintenance Tasks](#common-maintenance-tasks)
4. [Image Management](#image-management)
5. [Content Updates](#content-updates)
6. [Development Tips](#development-tips)

## Project Structure

The website is built using Next.js with TypeScript and Tailwind CSS. Here are the key directories:

- `/src/app`: Main application pages
- `/src/components`: Reusable React components
- `/public`: Static assets (images, etc.)
- `/src/lib`: Utility functions and shared code
- `/src/styles`: Global styles and Tailwind configuration

## Getting Started

1. **Prerequisites**
   - Node.js (v18 or higher)
   - npm or yarn
   - Git

2. **Local Development**
   ```bash
   # Install dependencies
   npm install

   # Run development server
   npm run dev
   ```

## Common Maintenance Tasks

### 1. Updating Homepage Images
The homepage images are managed in `/src/app/page.tsx`. Each image is defined in the `products` array:

```typescript
const products = [
  {
    title: "Event Title",
    link: "#",
    thumbnail: "/path-to-image.jpeg"
  },
  // ... more images
];
```

To update images:
1. Add new images to the `/public` directory
2. Update the `products` array with new image paths and titles
3. Images should be in JPEG/PNG format and optimized for web

### 2. Updating Content Sections
The main content sections are defined in the same file under the `content` array:

```typescript
const content = [
  {
    title: "Section Title",
    description: "Section description",
    content: (
      <div className="...">
        {/* Section content */}
      </div>
    ),
  },
  // ... more sections
];
```

### 3. Managing Navigation
Navigation links are managed in `/src/components/ui/nav-bar.tsx`.

## Image Management

### Adding New Images:
1. Place images in the `/public` directory
2. Update relevant component files with new image paths

## Content Updates

### Recruitment Page
- Update recruitment information in `/src/components/recruitment/recruitment-hero.tsx`
- Modify recruitment timeline in the recruitment page component

### Blog Posts
- Blog posts are stored in `/src/content/blog`
- Follow the existing format for new posts
- Update metadata for proper indexing

## Development Tips

### 1. Component Structure
- Keep components modular and reusable
- Use TypeScript interfaces for props
- Follow existing naming conventions

### 2. Styling
- Use Tailwind CSS classes for styling
- Maintain consistent spacing and layout
- Follow mobile-first responsive design

### 3. Performance
- Optimize images before adding to the site
- Use Next.js Image component for automatic optimization
- Keep bundle size minimal by avoiding unnecessary dependencies

### 4. Testing
- Test all changes on multiple devices and browsers
- Verify mobile responsiveness
- Check loading performance

## Troubleshooting

Common issues and solutions:

1. **Images not loading**
   - Verify file paths are correct
   - Check file permissions
   - Ensure images are in the correct format

2. **Build errors**
   - Run `npm run build` to check for issues
   - Check console for error messages
   - Verify all dependencies are installed

## Deployment

The website is deployed using Vercel. To deploy updates:

1. Commit changes to the main branch
2. Push to GitHub
3. Vercel will automatically deploy the changes

## Contact

For additional help or questions, contact:
- Previous Website Chair
- Chapter Technology Committee

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
