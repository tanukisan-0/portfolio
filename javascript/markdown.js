marked.setOptions({
  breaks: true,
  gfm: true,
});

fetch("../markdown/sample.md")
  .then(res => {
    if (!res.ok) throw new Error("読み込み失敗: " + res.status);
    return res.text();
  })
  .then(mdText => {
    const contentEl = document.getElementById("content");

    // 1) ブロック数式 $$...$$ を抽出してプレースホルダに置き換え
    const blockMaths = [];
    const placeholderPrefix = "@@MATH_BLOCK_@@";
    const mdWithPlaceholders = mdText.replace(/\$\$([\s\S]*?)\$\$/g, (m, inner) => {
      const idx = blockMaths.length;
      blockMaths.push(inner);
      return placeholderPrefix + idx + "@@";
    });

    // 2) Markdown -> HTML
    const html = marked.parse(mdWithPlaceholders);

    // 3) HTML 内のプレースホルダを katex.renderToString(..., {displayMode:true}) に置換
    let finalHtml = html;
    blockMaths.forEach((math, i) => {
      try {
        const rendered = katex.renderToString(math, {
          displayMode: true,
          throwOnError: false
        });
        // プレースホルダをそのまま置換（HTML内に挿入）
        finalHtml = finalHtml.split(placeholderPrefix + i + "@@").join(rendered);
      } catch (err) {
        // 失敗したら元テキストをそのまま入れておく
        finalHtml = finalHtml.split(placeholderPrefix + i + "@@").join("<pre>" + escapeHtml(math) + "</pre>");
      }
    });

    // 4) 挿入
    contentEl.innerHTML = finalHtml;

    // 5) インライン数式（$...$）を auto-render で処理（ブロックは既に処理済みなので delimiters は$のみ）
    if (typeof renderMathInElement !== "undefined") {
      renderMathInElement(contentEl, {
        delimiters: [
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }

  })
  .catch(err => {
    document.getElementById("content").innerText = "エラー: " + err.message;
  });

// HTMLエスケープ（エラー時の代替表示用）
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
