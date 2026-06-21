from langchain_core.tools import tool


@tool
def web_search(query: str) -> str:
    """Search the web for information about a given query.
    Returns search results as text. Currently a placeholder.
    """
    return (
        f"Web search results for '{query}': "
        f"[Placeholder - integrate Tavily or SerpAPI for real results]. "
        f"This is a mock response for development purposes."
    )
