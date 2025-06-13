using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiIntegration.Api.Data;
using ApiIntegration.Api.DTOs;
using ApiIntegration.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

namespace ApiIntegration.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class PersonController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PersonController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/person
        /// <summary>
        /// Gets all people
        /// </summary>
        /// <returns>List of people without their products</returns>
        /// <response code="200">Returns the list of people</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<PersonListDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PersonListDto>>> GetPeople()
        {
            var people = await _context.People
                .AsNoTracking()
                .Select(p => new { p.Id, p.Name, p.Email, p.CreatedAt })
                .ToListAsync();

            return Ok(people.Select(p => new PersonListDto
            {
                Id = p.Id,
                Name = p.Name,
                Email = p.Email,
                CreatedAt = p.CreatedAt
            }));
        }

        // GET: api/person/{id}
        /// <summary>
        /// Gets a specific person by id including their products
        /// </summary>
        /// <param name="id">The person's ID</param>
        /// <returns>The person details with their products</returns>
        /// <response code="200">Returns the person with their products</response>
        /// <response code="404">If the person is not found</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PersonDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PersonDto>> GetPerson(Guid id)
        {
            var person = await _context.People
                .Include(p => p.Products)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (person == null)
            {
                return NotFound();
            }

            return new PersonDto
            {
                Id = person.Id,
                Name = person.Name,
                Email = person.Email,
                CreatedAt = person.CreatedAt,
                Products = person.Products.Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    CreatedAt = p.CreatedAt,
                    PersonId = p.PersonId
                }).ToList()
            };
        }

        // POST: api/person
        [HttpPost]
        public async Task<ActionResult<PersonDto>> CreatePerson(CreatePersonDto createPersonDto)
        {
            var person = new Person
            {
                Id = Guid.NewGuid(),
                Name = createPersonDto.Name,
                Email = createPersonDto.Email,
                CreatedAt = DateTime.UtcNow
            };

            _context.People.Add(person);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPerson), new { id = person.Id }, new PersonDto
            {
                Id = person.Id,
                Name = person.Name,
                Email = person.Email,
                CreatedAt = person.CreatedAt,
                Products = new List<ProductDto>()
            });
        }

        // PUT: api/person/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePerson(Guid id, UpdatePersonDto updatePersonDto)
        {
            var person = await _context.People.FindAsync(id);
            if (person == null)
            {
                return NotFound();
            }

            person.Name = updatePersonDto.Name;
            person.Email = updatePersonDto.Email;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PersonExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/person/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePerson(Guid id)
        {
            var person = await _context.People.FindAsync(id);
            if (person == null)
            {
                return NotFound();
            }

            _context.People.Remove(person);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PersonExists(Guid id)
        {
            return _context.People.Any(e => e.Id == id);
        }
    }
} 