"""
RAG-Powered Knowledge Assistant
--------------------------------
Upload any PDF and ask questions about it.
Runs entirely locally — no API keys required.
"""

import streamlit as st
from rag_pipeline import process_pdf, get_qa_chain

# ── Page config ───────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="RAG Knowledge Assistant",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    st.title("🧠 RAG Assistant")
    st.caption("Powered by LangChain · ChromaDB · Ollama")

    st.divider()

    st.subheader("⚙️ Settings")
    ollama_model = st.selectbox(
        "Ollama model",
        options=["llama3.2", "llama3", "mistral", "phi3", "gemma2"],
        index=0,
        help="Make sure the selected model is pulled locally via `ollama pull <model>`",
    )

    st.divider()

    st.subheader("📖 How it works")
    st.markdown(
        """
        1. **Upload** a PDF document
        2. It gets **chunked** into passages
        3. Each passage is **embedded** locally using `all-MiniLM-L6-v2`
        4. Embeddings are stored in **ChromaDB**
        5. Your question is embedded and the **top matching passages** are retrieved
        6. A local **Ollama LLM** generates an answer grounded in those passages
        """
    )

    st.divider()
    st.caption("No data leaves your machine.")

# ── Main area ─────────────────────────────────────────────────────────────────

st.title("RAG-Powered Knowledge Assistant")
st.write("Upload a PDF, then ask anything about it. Answers are grounded in the document.")

uploaded_file = st.file_uploader("Upload a PDF", type=["pdf"], label_visibility="collapsed")

if uploaded_file:
    # Process the PDF only when a new file is uploaded
    file_key = f"{uploaded_file.name}-{uploaded_file.size}"
    if st.session_state.get("file_key") != file_key:
        with st.status("Processing document…", expanded=True) as status:
            st.write("📄 Loading and chunking PDF…")
            vectorstore, n_chunks = process_pdf(uploaded_file)
            st.write(f"🔢 Embedding {n_chunks} chunks with `all-MiniLM-L6-v2`…")
            st.session_state.vectorstore = vectorstore
            st.session_state.file_key   = file_key
            st.session_state.filename   = uploaded_file.name
            st.session_state.n_chunks   = n_chunks
            st.session_state.messages   = []
            status.update(label="✅ Document ready!", state="complete")

    st.info(
        f"**{st.session_state.filename}** — {st.session_state.n_chunks} chunks indexed",
        icon="📄",
    )

    st.divider()

    # ── Chat history ──────────────────────────────────────────────────────────
    for msg in st.session_state.get("messages", []):
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if msg.get("sources"):
                with st.expander("📄 Source passages"):
                    for i, (doc, meta) in enumerate(
                        zip(msg["sources"]["docs"], msg["sources"]["metas"]), start=1
                    ):
                        page = meta.get("page", "?")
                        st.markdown(f"**Passage {i} — page {page + 1}**")
                        st.caption(doc[:400] + ("…" if len(doc) > 400 else ""))
                        if i < len(msg["sources"]["docs"]):
                            st.divider()

    # ── Input ─────────────────────────────────────────────────────────────────
    if question := st.chat_input("Ask a question about the document…"):
        # Show user message
        st.session_state.messages.append({"role": "user", "content": question})
        with st.chat_message("user"):
            st.markdown(question)

        # Generate answer
        with st.chat_message("assistant"):
            with st.spinner(f"Querying `{ollama_model}`…"):
                try:
                    chain  = get_qa_chain(st.session_state.vectorstore, ollama_model)
                    result = chain.invoke(question)

                    answer   = result["answer"]
                    src_docs = result.get("context", [])

                    st.markdown(answer)

                    sources = None
                    if src_docs:
                        sources = {
                            "docs":  [d.page_content for d in src_docs],
                            "metas": [d.metadata     for d in src_docs],
                        }
                        with st.expander("📄 Source passages"):
                            for i, (doc, meta) in enumerate(
                                zip(sources["docs"], sources["metas"]), start=1
                            ):
                                page = meta.get("page", "?")
                                st.markdown(f"**Passage {i} — page {page + 1}**")
                                st.caption(
                                    doc[:400] + ("…" if len(doc) > 400 else "")
                                )
                                if i < len(sources["docs"]):
                                    st.divider()

                    st.session_state.messages.append(
                        {"role": "assistant", "content": answer, "sources": sources}
                    )

                except Exception as e:
                    err = str(e)
                    if "connection" in err.lower() or "refused" in err.lower():
                        st.error(
                            "⚠️ Cannot reach Ollama. Make sure it's running: `ollama serve`"
                        )
                    else:
                        st.error(f"⚠️ Error: {err}")

else:
    # Empty state
    st.markdown(
        """
        <div style="text-align:center; padding: 4rem 0; color: #9ca3af;">
            <div style="font-size: 3rem;">📂</div>
            <p style="font-size: 1.1rem; margin-top: 1rem;">Upload a PDF above to get started</p>
            <p style="font-size: 0.875rem;">Works with research papers, textbooks, reports, documentation — any PDF</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
