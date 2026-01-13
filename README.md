# Praca-zespo-owa

Prosty przykład rozproszonej aplikacji TODO: backend (Express + SQLite + Socket.IO) i frontend (statyczny HTML/JS).

Uruchomienie lokalnie:

1. Zainstaluj zależności:

```bash
npm install
```

2. Uruchom serwer:

```bash
npm start
```

3. Otwórz przeglądarkę pod adresem: http://localhost:3000

Opis:
- Serwer przechowuje zadania w pliku SQLite `tasks.db` i udostępnia REST API `/api/tasks`.
- Frontend znajduje się w katalogu `public` i komunikuje się z serwerem przez HTTP oraz Socket.IO (real-time aktualizacje).
