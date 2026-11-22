import unittest

from app.tools.mermaid import quick_sanity_check, validate_mermaid_syntax


class TestMermaidValidation(unittest.TestCase):

    def test_valid_mermaid(self):
        code = "graph TD; A-->B;"
        res = validate_mermaid_syntax(code)

        self.assertTrue(res["valid"])
        self.assertIsNone(res["error"])

    def test_invalid_mermaid(self):
        code = "not a valid code"
        res = validate_mermaid_syntax(code)

        self.assertFalse(res["valid"])
        self.assertIsNotNone(res["error"])


class TestQuickSanityCheck(unittest.TestCase):
    def test_valid_mermaid(self):
        code = "graph TD; A-->B;"
        is_valid, error = quick_sanity_check(code)
        self.assertTrue(is_valid)
        self.assertIsNone(error)

    def test_invalid_mermaid(self):
        code = "not a mermaid code"
        is_valid, error = quick_sanity_check(code)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)


if __name__ == "__main__":
    unittest.main()

