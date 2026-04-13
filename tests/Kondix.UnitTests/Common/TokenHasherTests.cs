using Kondix.Application.Common;
using FluentAssertions;

namespace Kondix.UnitTests.Common;

public class TokenHasherTests
{
    [Fact]
    public void Hash_ShouldBeDeterministic()
    {
        var hash1 = TokenHasher.Hash("test-token");
        var hash2 = TokenHasher.Hash("test-token");
        hash1.Should().Be(hash2);
    }

    [Fact]
    public void Hash_ShouldDifferFromInput()
    {
        var token = "test-token";
        var hash = TokenHasher.Hash(token);
        hash.Should().NotBe(token);
    }

    [Fact]
    public void Hash_DifferentInputs_ShouldProduceDifferentHashes()
    {
        var hash1 = TokenHasher.Hash("token-1");
        var hash2 = TokenHasher.Hash("token-2");
        hash1.Should().NotBe(hash2);
    }
}
