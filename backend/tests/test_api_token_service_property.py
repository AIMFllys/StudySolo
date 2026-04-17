from app.services.api_token_service import (
    TOKEN_PREFIX,
    TOKEN_PREFIX_DISPLAY_LEN,
    token_display_prefix,
)


def test_token_display_prefix_includes_random_fragment():
    plaintext = f"{TOKEN_PREFIX}abcdefghABCDEFGH12345678"

    display = token_display_prefix(plaintext)

    assert display == f"{TOKEN_PREFIX}abcdefgh"
    assert len(display) == len(TOKEN_PREFIX) + 8
    assert TOKEN_PREFIX_DISPLAY_LEN == len(TOKEN_PREFIX) + 8
    assert display != TOKEN_PREFIX
