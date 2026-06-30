using MCCPortfolioAPI.Data;
using Microsoft.EntityFrameworkCore;
using System;

namespace MCCPortfolioAPI.Tests
{
    public static class TestDatabaseFixture
    {
        public static ApplicationDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }
    }
}
