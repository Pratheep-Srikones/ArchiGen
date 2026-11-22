import unittest

from app.tools.mermaid import validate_mermaid, quick_sanity_check

class TestMermaidValidation(unittest.TestCase):

    def test_valid_mermaid(self):
        code = "graph TD; A-->B;"
        is_valid, error = validate_mermaid(code)

        self.assertTrue(is_valid)
        self.assertEqual(error, "valid mermaid code")

    def test_invalid_mermaid(self):
        code = "not a valid code"
        is_valid, error = validate_mermaid(code)

        self.assertFalse(is_valid)
        self.assertIsNotNone(error)

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
    