import ast
import operator

from langchain_core.tools import tool


@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression and return the result.
    Supports basic arithmetic: +, -, *, /, **, %, and parentheses.
    Example: calculator("2 + 3 * (4 - 1)") returns "11"
    """
    # Allowed operators for safe evaluation
    allowed_ops = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.FloorDiv: operator.floordiv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
        ast.UAdd: operator.pos,
    }

    MAX_EXPONENT = 1000  # Cap exponent magnitude to prevent CPU/memory exhaustion

    def _eval(node):
        if isinstance(node, ast.Expression):
            return _eval(node.body)
        elif isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        elif isinstance(node, ast.BinOp):
            op_type = type(node.op)
            if op_type not in allowed_ops:
                raise ValueError(f"Unsupported operator: {op_type.__name__}")
            left = _eval(node.left)
            right = _eval(node.right)
            if op_type == ast.Pow and abs(right) > MAX_EXPONENT:
                raise ValueError(f"Exponent too large (max {MAX_EXPONENT}): {right}")
            return allowed_ops[op_type](left, right)
        elif isinstance(node, ast.UnaryOp):
            op_type = type(node.op)
            if op_type not in allowed_ops:
                raise ValueError(f"Unsupported operator: {op_type.__name__}")
            operand = _eval(node.operand)
            return allowed_ops[op_type](operand)
        else:
            raise ValueError(f"Unsupported expression element: {type(node).__name__}")

    try:
        tree = ast.parse(expression, mode="eval")
        result = _eval(tree)
        return str(result)
    except Exception as e:
        return f"Error evaluating expression: {e}"
