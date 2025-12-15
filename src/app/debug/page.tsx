import Link from 'next/link';
import fs from 'fs';
import path from 'path';

interface Endpoint {
  category: string;
  name: string;
  path: string;
  isAPI: boolean;
}

function scanDirectory(dir: string, basePath: string = ''): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const routePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      endpoints.push(...scanDirectory(fullPath, routePath));
    } else if (entry.name === 'page.tsx' || entry.name === 'route.ts') {
      // Found a route
      const isAPI = basePath.startsWith('api');
      let urlPath = basePath.replace(/\\/g, '/');
      
      // Convert to URL format
      if (!urlPath.startsWith('/')) {
        urlPath = '/' + urlPath;
      }

      // Determine category
      let category = 'Pages';
      if (isAPI) {
        const parts = urlPath.split('/').filter(p => p && p !== 'api');
        category = parts.length > 0 ? `API - ${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)}` : 'API';
      } else if (urlPath.startsWith('/auth')) {
        category = 'Auth';
      } else if (urlPath === '/') {
        category = 'Pages';
      } else {
        const topLevel = urlPath.split('/')[1];
        category = topLevel ? topLevel.charAt(0).toUpperCase() + topLevel.slice(1) : 'Pages';
      }

      // Generate name from path
      const name = urlPath === '/' ? 'Home' : 
                   urlPath.split('/').filter(p => p).map(p => 
                     p.charAt(0).toUpperCase() + p.slice(1).replace(/[_-]/g, ' ')
                   ).join(' > ');

      // Check if path contains dynamic segments
      const hasDynamicSegment = urlPath.includes('[');

      endpoints.push({
        category,
        name,
        path: urlPath,
        isAPI: isAPI || hasDynamicSegment // Treat dynamic routes as non-clickable
      });
    }
  }

  return endpoints;
}

export default function DebugPage() {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const endpoints = scanDirectory(appDir).filter(e => e.path !== '/debug');
  
  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = [];
    }
    acc[endpoint.category].push(endpoint);
    return acc;
  }, {} as Record<string, Endpoint[]>);

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Debug - Available Endpoints</h1>
      
      {Object.entries(groupedEndpoints).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">{category}</h2>
          <div className="grid gap-3">
            {items.map((endpoint, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 border rounded hover:bg-gray-50">
                <div className="flex-1">
                  <div className="font-medium">{endpoint.name}</div>
                  <div className="text-sm text-gray-600 font-mono">{endpoint.path}</div>
                </div>
                {!endpoint.isAPI && (
                  <Link
                    href={endpoint.path}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Visit
                  </Link>
                )}
                {endpoint.isAPI && (
                  <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed">
                    API
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
