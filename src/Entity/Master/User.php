<?php

namespace App\Entity\Master;

use App\Entity\Trait\ActiveTrait;
use App\Entity\Trait\IdTrait;
use App\Entity\Trait\TimestampsTrait;
use App\Entity\Trait\UserSecurityTrait;
use App\Repository\Master\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Utente del DB centrale (master): ROLE_ADMIN e ROLE_NOTARY.
 * Creato a mano / tramite comando app:create-user (nessuna registrazione pubblica).
 */
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'eb_m_user')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    use IdTrait;
    use UserSecurityTrait;
    use ActiveTrait;
    use TimestampsTrait;

    public function isAdmin(): bool
    {
        return $this->role === 'ROLE_ADMIN';
    }

    public function isNotary(): bool
    {
        return $this->role === 'ROLE_NOTARY';
    }
}
