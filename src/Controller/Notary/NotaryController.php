<?php

namespace App\Controller\Notary;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/notaio')]
#[IsGranted('ROLE_NOTARY')]
class NotaryController extends AbstractController
{
    #[Route('', name: 'notary_index', methods: ['GET'])]
    public function index(): Response
    {
        return $this->render('notary/index.html.twig');
    }
}
