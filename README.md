# Math Tutoring Website — Maintenance Guide

A simple, dependency-free website for a math tutoring service. It's just plain
HTML and one CSS file — there is **no build step and nothing to install**. To
change the site, you edit a file and save it. That's the whole workflow.

---

## 1. The files at a glance

| File | What it is |
|------|------------|
| `index.html` | **About** page (home) — bio and credentials |
| `philosophy.html` | **Teaching Philosophy** page |
| `resources.html` | **Resources** page — your list of books, sites, and tools |
| `contact.html` | **Contact** page — how people reach you |
| `styles.css` | All the styling (colors, fonts, layout) for every page |
| `assets/blob-bg.js` | The animated inkblot ornament in the corner |
| `README.md` | This guide |
| `.nojekyll` | A blank file that tells GitHub to serve the site as-is. Leave it alone. |

Anything written in `[SQUARE BRACKETS]` in the HTML is a **placeholder** for you
to replace with your real text.

---

## 2. Publishing the site (one-time setup)

1. Push these files to a GitHub repository (see the bottom of this guide for the
   git commands).
2. On GitHub, open the repo and go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set the branch to your main branch (e.g. `main`) and the folder to `/ (root)`,
   then **Save**.
5. Wait a minute, then visit the URL GitHub shows you. It will look like
   `https://YOUR-USERNAME.github.io/REPO-NAME/`.

> **Tip:** If you name the repository exactly `YOUR-USERNAME.github.io`, the site
> lives at the cleaner address `https://YOUR-USERNAME.github.io/` with no repo
> name in the path.

After setup, **every time you push a change, the live site updates automatically**
within a minute or two.

---

## 3. Editing the words on a page

1. Open the relevant `.html` file (see the table above).
2. Find the text you want to change — replace anything in `[BRACKETS]` and edit
   the regular sentences as you like.
3. Save, then commit and push (see section 9).

You can edit right on GitHub.com too: click a file, click the pencil icon, make
changes, and click **Commit changes**. No tools needed.

### Adding a resource or a tutoring item
On `resources.html`, items are blocks that look like this:

```html
<div class="card">
  <h3>Title goes here</h3>
  <p>One line of description.</p>
</div>
```

To add one, **copy a whole `<div class="card"> ... </div>` block** and edit the
copy. To make the title a link, wrap it in an `<a>` tag:

```html
<h3><a href="https://example.com" target="_blank" rel="noopener">Title</a></h3>
```

---

## 4. Changing the contact info

Open `contact.html` and edit the lines under
`<!-- ===== CONTACT DETAILS — edit these ===== -->`:

- Replace `[you@example.com]` (it appears **twice** on the email line — change both).
- Replace or delete the phone line.

### Want a real fill-in form instead of just an email link?
Inside `contact.html` there's a clearly marked **"OPTIONAL CONTACT FORM"** block
with step-by-step instructions. In short: make a free account at
[formspree.io](https://formspree.io), paste your form ID, and un-comment the form.
GitHub Pages can't email form submissions on its own, which is why a small free
service like Formspree is used.

---

## 5. The animated corner ornament

The little morphing inkblot in the upper-right corner is an animation drawn by
`assets/blob-bg.js`. It restlessly twitches, then snaps between recognizable
shapes (circle, scalene right triangle, cloud, bell curve, eye) in random order
before melting back into free-form blobs. It loops forever and always animates.

Things you can adjust (all in `styles.css`):

- **Size:** change `--ornament-size` (e.g. `130px`).
- **Opacity:** change `--ornament-opacity` (`1` = solid black, lower = softer).
- **Position:** in the `#blob-bg` rule, edit the `top` / `right` values to nudge
  it. (There are two: one for narrow screens, one inside the `min-width: 1000px`
  block for wide screens.)
- **Turn it off completely:** delete the line
  `<script defer src="assets/blob-bg.js"></script>` from the `<head>` of each
  HTML page.
- **Tuning the motion** (optional, for the curious): near the top of
  `blob-bg.js` are commented knobs like hold time and twitch amount. You don't
  need to touch these.

---

## 6. Changing colors and fonts

Open `styles.css`. Everything you'd want to adjust lives at the very top inside
the `:root { ... }` block — you rarely need to touch anything below it.

```css
--color-bg:   #fdfdfb;   /* page background */
--color-text: #141414;   /* main text */
--color-muted:#5a5a5a;   /* secondary text */
--font-heading: Georgia, "Times New Roman", serif;   /* headings */
--font-body:   -apple-system, ... sans-serif;          /* body text */
--max-width:  720px;     /* how wide the content column is */
```

Change a value, save, and the whole site updates. (Colors use hex codes — you can
pick one from any "color picker" website.)

---

## 7. Changing the domain name

### A) The free GitHub address
This is just your `github.io` URL from section 2. To change it, **rename the
repository** (Settings → General → rename) — the URL follows the new name.

### B) Using your own custom domain (e.g. `yourname.com`)
1. Buy the domain from any registrar (Namecheap, Cloudflare, Google Domains, etc.).
2. In your repo, go to **Settings → Pages → Custom domain**, type your domain,
   and **Save**. (This creates a file named `CNAME` in the repo — that's expected.)
3. At your domain registrar, add DNS records pointing to GitHub:
   - Four **A records** for the root domain (`yourname.com`) pointing to:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One **CNAME record** for `www` pointing to `YOUR-USERNAME.github.io`
4. Back in **Settings → Pages**, tick **Enforce HTTPS** once it becomes available
   (can take an hour or so).

GitHub's official walkthrough:
<https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site>

---

## 8. Previewing changes before they go live

You don't strictly need this — you can just push and look at the live site. But to
preview locally, open the `.html` file directly in your web browser
(double-click `index.html`). Everything works offline except the optional contact
form.

---

## 9. Saving your changes (git commands)

If you edit on GitHub.com, just click **Commit changes** and you're done. If you
edit files on your computer, run these in a terminal from the project folder:

```sh
git add .
git commit -m "Update site content"
git push
```

Within a minute or two, the live site reflects your changes.

---

## Quick reference

- **Change my bio/credentials** → `index.html`
- **Change my teaching philosophy** → `philosophy.html`
- **Add a book or website** → copy a `card` block in `resources.html`
- **Change my email/phone** → `contact.html`
- **Change colors or fonts** → top of `styles.css`
- **Resize/move/hide the corner ornament** → `--ornament-size` / `--ornament-opacity` / `#blob-bg` in `styles.css` (see section 5)
- **Change the web address** → section 7 above
