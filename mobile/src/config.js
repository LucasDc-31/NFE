// Em produção o PWA é servido pelo próprio backend, então a API fica no mesmo endereço ('').
// Em desenvolvimento (expo start --web) aponte para o backend:
//   EXPO_PUBLIC_API_URL=http://localhost:3000 npm run web
export const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
