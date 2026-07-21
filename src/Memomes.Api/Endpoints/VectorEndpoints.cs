using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Memomes.Api.Data;
using Memomes.Api.Models;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace Memomes.Api.Endpoints;

public static class VectorEndpoints
{
    public static RouteGroupBuilder MapVectorEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/upsert", UpsertVectorAsync);
        group.MapPost("/search", SearchVectorsAsync);

        return group;
    }

    public record UpsertVectorInput(
        Guid FileId,
        Guid UserId,
        string EncryptedMetadata,
        float[] Vector512
    );

    public record SearchVectorInput(
        Guid UserId,
        float[] QueryVector512,
        int Limit = 10
    );

    private static async Task<IResult> UpsertVectorAsync(
        UpsertVectorInput input,
        AppDbContext db)
    {
        if (input.Vector512 == null || input.Vector512.Length != 512)
        {
            return Results.BadRequest(new { Error = "Embedding vector must be exactly 512 dimensions" });
        }

        var pgVector = new Vector(input.Vector512);

        var existing = await db.EncryptedEmbeddings
            .FirstOrDefaultAsync(e => e.FileId == input.FileId && e.UserId == input.UserId);

        if (existing != null)
        {
            existing.EncryptedMetadata = input.EncryptedMetadata;
            existing.Embedding = pgVector;
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            var newEmbedding = new EncryptedEmbedding
            {
                FileId = input.FileId,
                UserId = input.UserId,
                EncryptedMetadata = input.EncryptedMetadata,
                Embedding = pgVector,
                CreatedAt = DateTime.UtcNow
            };
            db.EncryptedEmbeddings.Add(newEmbedding);
        }

        await db.SaveChangesAsync();
        return Results.Ok(new { Status = "Indexed", FileId = input.FileId, Dimensions = 512 });
    }

    private static async Task<IResult> SearchVectorsAsync(
        SearchVectorInput input,
        AppDbContext db)
    {
        var sw = Stopwatch.StartNew();

        if (input.QueryVector512 == null || input.QueryVector512.Length != 512)
        {
            return Results.BadRequest(new { Error = "Query vector must be exactly 512 dimensions" });
        }

        var queryPgVector = new Vector(input.QueryVector512);

        // Sub-5ms Cosine Similarity query via pgvector Cosine Distance operator (<-> / l2_distance or cosine_distance)
        var results = await db.EncryptedEmbeddings
            .Where(e => e.UserId == input.UserId)
            .OrderBy(e => e.Embedding.CosineDistance(queryPgVector))
            .Take(input.Limit)
            .Select(e => new
            {
                e.FileId,
                e.EncryptedMetadata,
                CosineDistance = e.Embedding.CosineDistance(queryPgVector)
            })
            .ToListAsync();

        sw.Stop();

        return Results.Ok(new
        {
            SearchLatencyMs = sw.Elapsed.TotalMilliseconds,
            ResultCount = results.Count,
            Matches = results
        });
    }
}
