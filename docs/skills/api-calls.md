# API Service Patterns

## Service File Template
import api from './api';

export const groupService = {
  list: async () => {
    const response = await api.get('/groups');
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/groups/${id}`);
    return response.data.data;
  },

  create: async (data: { name: string }) => {
    const response = await api.post('/groups', data);
    return response.data.data;
  },
};

## Error Handling
Errors come back as:
{ error: { code: string, message: string } }

Access the message with:
err.response?.data?.error?.message || 'Something went wrong'

## Auth Token
The axios interceptor in src/services/api.ts automatically
attaches the Bearer token to every request.
You never need to manually add Authorization headers.

## Loading States
Always track loading state in components:
const [loading, setLoading] = useState(false);
Show ActivityIndicator while loading.
Disable buttons while loading to prevent double submit.
```

---

## So Your Frontend Docs Folder Looks Like
```
innercircle-frontend/
├── AGENTS.md
├── docs/
│   ├── FEATURES.md
│   └── skills/
│       ├── components.md
│       ├── navigation.md
│       └── api-calls.md