<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Admin access is granted only via the user_roles table and checked server-side with has_role before any admin-client query; why: roles must never be client-controlled.
- Document ingestion uses request-scoped server handlers and browser-side PDF text extraction; why: AI credentials and elevated database access must stay server-side.
