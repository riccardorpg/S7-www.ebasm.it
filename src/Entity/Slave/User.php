<?php

namespace App\Entity\Slave;

use App\Entity\Trait\ActiveTrait;
use App\Entity\Trait\IdTrait;
use App\Entity\Trait\TimestampsTrait;
use App\Entity\Trait\UserSecurityTrait;
use App\Repository\Slave\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Utente del DB agenzia (slave): ROLE_AGENCY.
 * Creato dai ROLE_ADMIN dal pannello; vive nel database della propria Company.
 */
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'eb_s_user')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    use IdTrait;
    use UserSecurityTrait;
    use ActiveTrait;
    use TimestampsTrait;

    /** 7.1.9.6.1.2 Amministratore dell'agenzia si/no. */
    #[ORM\Column(name: 'is_admin', type: 'boolean', options: ['default' => false])]
    private bool $admin = false;

    public function __construct()
    {
        $this->role = 'ROLE_AGENCY';
    }

    public function isAdmin(): bool
    {
        return $this->admin;
    }

    public function setAdmin(bool $admin): static
    {
        $this->admin = $admin;

        return $this;
    }
}
